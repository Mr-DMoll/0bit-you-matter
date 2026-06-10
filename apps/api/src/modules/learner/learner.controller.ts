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
  const { subjects, chosenCareerId } = req.body;

  const profile = await prisma.learnerProfile.upsert({
    where:  { learnerId },
    create: { learnerId, subjects, chosenCareerId },
    update: { subjects, chosenCareerId },
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

export const getChatHistory = catchAsync(async (req: Request, res: Response) => {
  return res.status(HttpStatus.OK).json({ status: "success", data: [] });
});

export const sendChatMessage = catchAsync(async (req: Request, res: Response) => {
  const learnerId = req.user!.userId;
  const { message, history } = req.body;
  if (!message?.trim()) throw new AppError("Message is required", HttpStatus.BAD_REQUEST);

  const { runLearnerGuidanceAgent } = await import("../../agents/learnerGuidance.agent.js");
  const reply = await runLearnerGuidanceAgent(learnerId, message, history ?? []);

  return res.status(HttpStatus.OK).json({ status: "success", data: { reply } });
});
