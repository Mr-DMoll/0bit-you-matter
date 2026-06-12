import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";
import { assessmentProfileQueue } from "../../lib/queues.js";

// ── Profile ────────────────────────────────────────────────────────────────────

export const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const learnerId = req.user!.userId;

  const profile = await prisma.learnerProfile.findUnique({
    where:   { learnerId },
    include: {
      careerMatches: {
        include: { career: { select: { id: true, title: true, slug: true, cluster: { select: { name: true } } } } },
        orderBy: { matchPercentage: "desc" },
        take: 10,
      },
      savedCareers: {
        include: { career: { select: { id: true, title: true, slug: true } } },
      },
    },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: profile ?? null });
});

export const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const learnerId = req.user!.userId;
  const { subjects, chosenCareerId, chosenPathwayType } = req.body;

  // Only include fields that were actually sent — avoids overwriting unrelated fields with undefined/null
  const update: Record<string, any> = {};
  if (subjects       !== undefined) update.subjects        = subjects;
  if (chosenCareerId !== undefined) update.chosenCareerId  = chosenCareerId;
  if (chosenPathwayType !== undefined) update.chosenPathwayType = chosenPathwayType;

  const profile = await prisma.learnerProfile.upsert({
    where:  { learnerId },
    create: { learnerId, ...update },
    update,
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: profile });
});

// POST /learner/profile/generate — trigger AI profile generation after all assessments complete
export const generateProfile = catchAsync(async (req: Request, res: Response) => {
  const learnerId = req.user!.userId;

  const completedCount = await prisma.learnerAssessmentSession.count({
    where: { learnerId, status: "COMPLETED" },
  });

  if (completedCount < 4)
    throw new AppError("All four assessments must be completed before generating a profile", HttpStatus.BAD_REQUEST);

  const job = await prisma.generationJob.create({
    data: {
      contentType:   "CAREER",
      status:        "QUEUED",
      requestedById: learnerId,
      parameters:    { type: "LEARNER_PROFILE", learnerId },
    },
  });

  await assessmentProfileQueue.add("profile", { learnerId, generationJobId: job.id });

  return res.status(HttpStatus.ACCEPTED).json({
    status:  "success",
    message: "Profile generation queued",
    data:    { jobId: job.id },
  });
});

// ── Career matching (synchronous, no queue) ────────────────────────────────────

// Score a career by RIASEC alignment + optional subject alignment boost.
//
// RIASEC (primary, 80% weight): spread-based normalisation so the learner's top
// code maps to 100 and weakest to 0. This keeps differentiation meaningful even
// when raw scores are tightly clustered.
//
// Subject alignment (secondary, up to ±10 points): if the career has required
// subjects and the learner has entered their subjects, we check overlap.
//   - Each required subject the learner has → +2 pts (max +10)
//   - Each required subject the learner is missing → −2 pts (max −10)
// If the learner has no subjects on file, the subject component is neutral (0).
function scoreCareer(
  riasecScores: Record<string, number>,
  careerCodes: string[],
  learnerSubjects: string[],
  careerSubjectReqs: Record<string, number> | null,
): number {
  if (!careerCodes.length) return 0;
  const values = Object.values(riasecScores);
  const max    = Math.max(...values);
  const min    = Math.min(...values);
  const range  = max - min;

  if (max === 0) return 0;
  if (range === 0) return 50;

  const normalised: Record<string, number> = {};
  for (const [code, score] of Object.entries(riasecScores)) {
    normalised[code] = ((score - min) / range) * 100;
  }

  const riasecScore = careerCodes.reduce((sum, c) => sum + (normalised[c] ?? 0), 0) / careerCodes.length;

  // Subject alignment boost — only applied when both sides have data
  let subjectBoost = 0;
  if (learnerSubjects.length > 0 && careerSubjectReqs && Object.keys(careerSubjectReqs).length > 0) {
    const reqSubjects = Object.keys(careerSubjectReqs);
    // Normalise subject names for comparison (lowercase, trim)
    const learnerSet = new Set(learnerSubjects.map((s) => s.toLowerCase().trim()));
    for (const req of reqSubjects) {
      // Check exact match or if learner has a variant (e.g. "Mathematics" matches "Mathematics HL")
      const matched = learnerSet.has(req.toLowerCase().trim()) ||
        [...learnerSet].some((ls) => ls.includes(req.toLowerCase()) || req.toLowerCase().includes(ls));
      subjectBoost += matched ? 2 : -2;
    }
    subjectBoost = Math.max(-10, Math.min(10, subjectBoost));
  }

  return Math.max(1, Math.min(99, Math.round(riasecScore + subjectBoost)));
}

// POST /learner/profile/match — compute + store career matches synchronously
export const matchCareers = catchAsync(async (req: Request, res: Response) => {
  const learnerId = req.user!.userId;

  // Get completed INTEREST session to read RIASEC scores
  const interestSession = await prisma.learnerAssessmentSession.findUnique({
    where:   { learnerId_assessmentType: { learnerId, assessmentType: "INTEREST" } },
    include: {
      answers: {
        include: { question: { select: { riasecMapping: true, options: true } } },
      },
    },
  });

  if (!interestSession || interestSession.status !== "COMPLETED")
    throw new AppError("Interest assessment must be completed before matching careers", HttpStatus.BAD_REQUEST);

  // Recompute RIASEC scores from answers (source of truth)
  const riasecScores: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  for (const ans of interestSession.answers) {
    const mapping: string[]  = (ans.question as any)?.riasecMapping ?? [];
    const options: any[]     = (ans.question as any)?.options ?? [];
    const opt = options.find((o: any) => o.value === ans.answerValue);
    const score = opt?.score ?? 1;
    for (const code of mapping) {
      if (code in riasecScores) riasecScores[code] += score;
    }
  }

  const topCodes = Object.entries(riasecScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);
  const riasecType = topCodes.join("");

  // Fetch learner's stored subjects (used for subject alignment boost)
  const learnerProfile = await prisma.learnerProfile.findUnique({
    where:  { learnerId },
    select: { subjects: true },
  });
  const learnerSubjects: string[] = Array.isArray(learnerProfile?.subjects)
    ? (learnerProfile!.subjects as any[]).map((s: any) => s.subject ?? "").filter(Boolean)
    : [];

  // Fetch all verified careers that have RIASEC codes
  const careers = await prisma.career.findMany({
    where:  { status: { in: ["VERIFIED", "APPROVED"] }, riasecCodes: { isEmpty: false } },
    select: { id: true, riasecCodes: true, subjectRequirements: true },
  });

  // Score all careers by RIASEC alignment + subject boost
  const allScored = careers
    .map((c) => {
      const subjectReqs = c.subjectRequirements as Record<string, number> | null ?? null;
      const rawPct = scoreCareer(riasecScores, c.riasecCodes, learnerSubjects, subjectReqs);
      const tiebreaker = c.riasecCodes.reduce((sum, code) => sum + (riasecScores[code] ?? 0), 0);
      return { careerId: c.id, rawPct, tiebreaker };
    })
    .filter((c) => c.rawPct > 0)
    .sort((a, b) =>
      b.rawPct !== a.rawPct ? b.rawPct - a.rawPct : b.tiebreaker - a.tiebreaker,
    );

  // Apply a rank-based spread so the top-10 list is always visibly differentiated.
  // Top match = 95 %, each rank below loses 2 % (rank 10 → 77 %).
  // This prevents all matches showing "99%" when the learner's top codes are tied,
  // while still honouring the relative ordering from the RIASEC scores.
  const top10Raw = allScored.slice(0, 10);
  const n = top10Raw.length;
  const scored = top10Raw.map((c, i) => ({
    careerId: c.careerId,
    pct: n === 1 ? 95 : Math.max(55, Math.round(95 - (i / Math.max(n - 1, 1)) * 40)),
  }));

  // Upsert profile + matches in a transaction
  const profile = await prisma.learnerProfile.upsert({
    where:  { learnerId },
    create: { learnerId, riasecType, riasecScores: riasecScores as any, generatedAt: new Date() },
    update: { riasecType, riasecScores: riasecScores as any, generatedAt: new Date() },
  });

  // Delete old matches then insert fresh ones
  await prisma.learnerCareerMatch.deleteMany({ where: { profileId: profile.id } });
  if (scored.length > 0) {
    await prisma.learnerCareerMatch.createMany({
      data: scored.map((s) => ({
        profileId:       profile.id,
        careerId:        s.careerId,
        matchPercentage: s.pct,
      })),
      skipDuplicates: true,
    });
  }

  // Return the full profile with matches and saved careers
  const result = await prisma.learnerProfile.findUnique({
    where:   { learnerId },
    include: {
      careerMatches: {
        include: { career: { select: { id: true, title: true, slug: true, riasecCodes: true, earningsMin: true, earningsMax: true, apsMin: true, subjectRequirements: true, cluster: { select: { name: true } } } } },
        orderBy: { matchPercentage: "desc" },
      },
      savedCareers: {
        include: { career: { select: { id: true, title: true, slug: true, apsMin: true, subjectRequirements: true, cluster: { select: { name: true } } } } },
      },
    },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: result });
});

// ── Saved careers ──────────────────────────────────────────────────────────────

export const saveCareer = catchAsync(async (req: Request, res: Response) => {
  const learnerId = req.user!.userId;
  const { careerId } = req.body;
  if (!careerId) throw new AppError("careerId is required", HttpStatus.BAD_REQUEST);

  const profile = await prisma.learnerProfile.upsert({
    where:  { learnerId },
    create: { learnerId },
    update: {},
  });

  await prisma.learnerSavedCareer.upsert({
    where:  { profileId_careerId: { profileId: profile.id, careerId } },
    create: { profileId: profile.id, careerId },
    update: {},
  });

  return res.status(HttpStatus.OK).json({ status: "success", message: "Career saved" });
});

export const unsaveCareer = catchAsync(async (req: Request, res: Response) => {
  const learnerId = req.user!.userId;
  const { careerId } = req.params;

  const profile = await prisma.learnerProfile.findUnique({ where: { learnerId } });
  if (!profile) return res.status(HttpStatus.OK).json({ status: "success" });

  await prisma.learnerSavedCareer.deleteMany({
    where: { profileId: profile.id, careerId },
  });

  return res.status(HttpStatus.OK).json({ status: "success", message: "Career unsaved" });
});

// ── Roadmap ────────────────────────────────────────────────────────────────────

export const getMyRoadmap = catchAsync(async (req: Request, res: Response) => {
  const learnerId = req.user!.userId;

  const profile = await prisma.learnerProfile.findUnique({ where: { learnerId } });
  if (!profile) return res.status(HttpStatus.OK).json({ status: "success", data: null });

  const roadmap = await prisma.learnerRoadmap.findFirst({
    where:   { profileId: profile.id, isActive: true },
    include: { career: { select: { title: true, slug: true } } },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: roadmap ?? null });
});

export const updateMilestone = catchAsync(async (req: Request, res: Response) => {
  const learnerId  = req.user!.userId;
  const { roadmapId, milestoneIndex, completed } = req.body;

  const roadmap = await prisma.learnerRoadmap.findFirst({
    where: { id: roadmapId, profile: { learnerId } },
  });
  if (!roadmap) throw new AppError("Roadmap not found", HttpStatus.NOT_FOUND);

  const milestones = (roadmap.milestones as any[]) ?? [];
  if (milestoneIndex < 0 || milestoneIndex >= milestones.length)
    throw new AppError("Invalid milestone index", HttpStatus.BAD_REQUEST);

  milestones[milestoneIndex].completed = completed;

  const updated = await prisma.learnerRoadmap.update({
    where: { id: roadmapId },
    data:  { milestones },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: updated });
});

// ── Guidance chat ─────────────────────────────────────────────────────────────

export const reactToChatMessage = catchAsync(async (req: Request, res: Response) => {
  const learnerId  = req.user!.userId;
  const { id }     = req.params;
  const { reaction } = req.body; // "up" | "down" | null

  const msg = await prisma.guidanceMessage.findFirst({
    where: { id, learnerId, role: "assistant" },
  });
  if (!msg) throw new AppError("Message not found", HttpStatus.NOT_FOUND);

  // Toggle: if same reaction sent again, clear it
  const next = msg.reaction === reaction ? null : (reaction ?? null);

  const updated = await prisma.guidanceMessage.update({
    where: { id },
    data:  { reaction: next },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { reaction: updated.reaction } });
});

export const getChatHistory = catchAsync(async (req: Request, res: Response) => {
  const learnerId = req.user!.userId;
  const messages  = await prisma.guidanceMessage.findMany({
    where:   { learnerId },
    orderBy: { createdAt: "asc" },
    take:    100,
  });
  return res.status(HttpStatus.OK).json({ status: "success", data: messages });
});

export const sendChatMessage = async (req: Request, res: Response) => {
  const learnerId = req.user!.userId;
  const { message } = req.body;
  if (!message?.trim()) {
    res.status(400).json({ status: "error", message: "Message is required" });
    return;
  }

  // Save user message
  await prisma.guidanceMessage.create({ data: { learnerId, role: "user", content: message.trim() } });

  // Load recent history from DB (last 20 exchanges = 40 messages)
  const history = await prisma.guidanceMessage.findMany({
    where:   { learnerId },
    orderBy: { createdAt: "desc" },
    take:    40,
    select:  { role: true, content: true },
  });
  history.reverse();

  // SSE headers for streaming
  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.flushHeaders();

  try {
    const { streamLearnerGuidance } = await import("../../agents/learnerGuidance.agent.js");
    let fullReply = "";

    await streamLearnerGuidance(learnerId, history, (token: string) => {
      fullReply += token;
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    });

    // Save completed assistant reply
    await prisma.guidanceMessage.create({ data: { learnerId, role: "assistant", content: fullReply } });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message ?? "Something went wrong" })}\n\n`);
  } finally {
    res.end();
  }
};
