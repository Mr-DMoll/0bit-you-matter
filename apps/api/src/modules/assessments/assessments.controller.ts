import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";

const ASSESSMENT_TYPES = ["INTEREST", "APTITUDE", "PERSONALITY", "VALUES"] as const;
type AssessmentTypeStr = typeof ASSESSMENT_TYPES[number];

// ── Question bank (staff) ──────────────────────────────────────────────────────

export const listQuestions = catchAsync(async (req: Request, res: Response) => {
  const page  = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 500); // respect caller, cap at 500
  const type   = req.query.type as AssessmentTypeStr | undefined;
  const status = req.query.status as string | undefined;

  const where: any = {};
  if (type)   where.assessmentType = type;
  // Support comma-separated statuses e.g. status=AI_GENERATED,IN_REVIEW
  if (status) {
    where.status = status.includes(",")
      ? { in: status.split(",").map((s) => s.trim()) }
      : status;
  }

  const [questions, total] = await Promise.all([
    prisma.assessmentQuestion.findMany({
      where,
      orderBy: [{ assessmentType: "asc" }, { orderIndex: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.assessmentQuestion.count({ where }),
  ]);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data:   { questions, pagination: { total, page, pages: Math.ceil(total / limit) } },
  });
});

export const createQuestion = catchAsync(async (req: Request, res: Response) => {
  const { assessmentType, questionText, riasecMapping, options, contextNote, orderIndex } = req.body;
  if (!assessmentType || !questionText)
    throw new AppError("assessmentType and questionText are required", HttpStatus.BAD_REQUEST);

  const question = await prisma.assessmentQuestion.create({
    data: {
      assessmentType,
      questionText,
      contextNote,
      riasecMapping: riasecMapping ?? [],
      options,
      orderIndex: orderIndex ?? 0,
    },
  });
  return res.status(HttpStatus.CREATED).json({ status: "success", data: question });
});

export const updateQuestion = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const q = await prisma.assessmentQuestion.findUnique({ where: { id } });
  if (!q) throw new AppError("Question not found", HttpStatus.NOT_FOUND);

  const updated = await prisma.assessmentQuestion.update({ where: { id }, data: req.body });
  return res.status(HttpStatus.OK).json({ status: "success", data: updated });
});

// ── Learner assessment sessions ────────────────────────────────────────────────

// GET /assessments/me — get all four session statuses for the current learner
export const myAssessments = catchAsync(async (req: Request, res: Response) => {
  const learnerId = req.user!.userId;

  const sessions = await prisma.learnerAssessmentSession.findMany({
    where: { learnerId },
    select: {
      id: true, assessmentType: true, status: true,
      startedAt: true, completedAt: true,
      _count: { select: { answers: true } },
    },
  });

  // Build a map so missing types appear as NOT_STARTED
  const map: Record<string, any> = {};
  for (const s of sessions) map[s.assessmentType] = s;

  const result = ASSESSMENT_TYPES.map((type) => map[type] ?? { assessmentType: type, status: "NOT_STARTED" });

  return res.status(HttpStatus.OK).json({ status: "success", data: result });
});

// GET /assessments/:type/questions — fetch approved questions for a given assessment type
export const getAssessmentQuestions = catchAsync(async (req: Request, res: Response) => {
  const type = req.params.type.toUpperCase() as AssessmentTypeStr;
  if (!(ASSESSMENT_TYPES as readonly string[]).includes(type))
    throw new AppError("Invalid assessment type", HttpStatus.BAD_REQUEST);

  // Per-type sample sizes — enough for reliable scoring without fatiguing learners
  // INTEREST / PERSONALITY need more items for multi-dimension scoring
  // APTITUDE / VALUES are shorter (cognitively taxing / reflective)
  // TODO: make these configurable from admin dashboard
  const QUESTIONS_PER_TYPE: Record<AssessmentTypeStr, number> = {
    INTEREST:    20,
    PERSONALITY: 20,
    APTITUDE:    15,
    VALUES:      15,
  };

  const questionsPerSession = QUESTIONS_PER_TYPE[type] ?? 20;

  // Fetch at most 4× what we need — enough variety without loading the whole bank
  const bank = await prisma.assessmentQuestion.findMany({
    where:   { assessmentType: type, status: { in: ["APPROVED", "VERIFIED"] } },
    select:  { id: true, questionText: true, contextNote: true, options: true, riasecMapping: true },
    take:    questionsPerSession * 4,
  });
  const shuffled  = [...bank].sort(() => Math.random() - 0.5);
  const questions = shuffled.slice(0, questionsPerSession);

  return res.status(HttpStatus.OK).json({ status: "success", data: questions, total: questionsPerSession });
});

// POST /assessments/:type/start — create or resume a session
export const startAssessment = catchAsync(async (req: Request, res: Response) => {
  const type      = req.params.type.toUpperCase() as AssessmentTypeStr;
  const learnerId = req.user!.userId;

  if (!(ASSESSMENT_TYPES as readonly string[]).includes(type))
    throw new AppError("Invalid assessment type", HttpStatus.BAD_REQUEST);

  const existing = await prisma.learnerAssessmentSession.findUnique({
    where: { learnerId_assessmentType: { learnerId, assessmentType: type } },
  });

  if (existing?.status === "COMPLETED")
    throw new AppError("Assessment already completed", HttpStatus.CONFLICT);

  const session = existing
    ? existing
    : await prisma.learnerAssessmentSession.create({
        data: { learnerId, assessmentType: type, status: "IN_PROGRESS", startedAt: new Date() },
      });

  // Return already-answered question IDs so the app can skip them
  const answered = await prisma.learnerAnswer.findMany({
    where:  { sessionId: session.id },
    select: { questionId: true },
  });

  return res.status(HttpStatus.OK).json({
    status: "success",
    data:   { session, answeredQuestionIds: answered.map((a) => a.questionId) },
  });
});

// POST /assessments/:type/answer — save a single answer
export const saveAnswer = catchAsync(async (req: Request, res: Response) => {
  const type      = req.params.type.toUpperCase() as AssessmentTypeStr;
  const learnerId = req.user!.userId;
  const { questionId, answerValue } = req.body;

  if (!questionId || answerValue === undefined)
    throw new AppError("questionId and answerValue are required", HttpStatus.BAD_REQUEST);

  const session = await prisma.learnerAssessmentSession.findUnique({
    where: { learnerId_assessmentType: { learnerId, assessmentType: type } },
  });
  if (!session) throw new AppError("No active session for this assessment", HttpStatus.NOT_FOUND);
  if (session.status === "COMPLETED") throw new AppError("Assessment already completed", HttpStatus.CONFLICT);

  await prisma.learnerAnswer.upsert({
    where:  { sessionId_questionId: { sessionId: session.id, questionId } },
    create: { sessionId: session.id, questionId, answerValue: String(answerValue) },
    update: { answerValue: String(answerValue) },
  });

  return res.status(HttpStatus.OK).json({ status: "success", message: "Answer saved" });
});

// POST /assessments/:type/complete — mark complete, compute scores, trigger profile worker
export const completeAssessment = catchAsync(async (req: Request, res: Response) => {
  const type      = req.params.type.toUpperCase() as AssessmentTypeStr;
  const learnerId = req.user!.userId;

  const session = await prisma.learnerAssessmentSession.findUnique({
    where:   { learnerId_assessmentType: { learnerId, assessmentType: type } },
    include: {
      answers: {
        include: { question: { select: { riasecMapping: true, options: true } } },
      },
    },
  });

  if (!session) throw new AppError("No active session found", HttpStatus.NOT_FOUND);
  if (session.status === "COMPLETED") throw new AppError("Already completed", HttpStatus.CONFLICT);

  const results = computeResults(type, session.answers as any);

  await prisma.learnerAssessmentSession.update({
    where: { id: session.id },
    data:  { status: "COMPLETED", completedAt: new Date(), results },
  });

  // Check if all 4 are done — if so, trigger profile generation notification
  const allSessions = await prisma.learnerAssessmentSession.count({
    where: { learnerId, status: "COMPLETED" },
  });

  // Explicit audit log so the activity log shows assessment completions
  await prisma.auditLog.create({
    data: {
      userId: learnerId,
      action: "ASSESSMENT_COMPLETED",
      meta:   { assessmentType: type, allCompleted: allSessions >= 4 },
    },
  }).catch(() => {});
  req.auditLogged = true;

  return res.status(HttpStatus.OK).json({
    status: "success",
    data:   { results, allCompleted: allSessions >= 4 },
  });
});

// ── Score computation helpers ──────────────────────────────────────────────────

function computeResults(type: AssessmentTypeStr, answers: any[]): object {
  if (type === "INTEREST") {
    const scores: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    for (const ans of answers) {
      const mapping: string[] = ans.question.riasecMapping ?? [];
      const options: any[]    = (ans.question.options as any[]) ?? [];
      const opt = options.find((o: any) => o.value === ans.answerValue);
      if (opt) {
        for (const code of mapping) {
          if (code in scores) scores[code] += opt.score ?? 1;
        }
      }
    }
    const topCodes = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([code]) => code)
      .join("");
    return { riasecScores: scores, riasecType: topCodes };
  }

  // For APTITUDE / PERSONALITY / VALUES: simple tallies per option value
  const tally: Record<string, number> = {};
  for (const ans of answers) {
    tally[ans.answerValue] = (tally[ans.answerValue] ?? 0) + 1;
  }
  return { tally };
}
