import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";

// ── Manager dashboard ──────────────────────────────────────────────────────────

export const managerDashboard = catchAsync(async (req: Request, res: Response) => {
  const managerId = req.user!.userId;

  const [totalLearners, completedAssessments, atRiskCount] = await Promise.all([
    prisma.user.count({ where: { managerId, role: "LEARNER", accountStatus: { not: "DELETED" } } }),
    prisma.learnerAssessmentSession.count({
      where: { status: "COMPLETED", learner: { managerId } },
    }),
    prisma.user.count({
      where: {
        managerId,
        role:          "LEARNER",
        accountStatus: "ACTIVE",
        lastActiveAt:  { lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }, // 14 days inactive
      },
    }),
  ]);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data:   { totalLearners, completedAssessments, atRiskCount },
  });
});

// ── My learners ────────────────────────────────────────────────────────────────

export const myLearners = catchAsync(async (req: Request, res: Response) => {
  const managerId = req.user!.userId;
  const page      = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit     = 50;
  const search    = req.query.search as string | undefined;

  const where: any = { managerId, role: "LEARNER", accountStatus: { not: "DELETED" } };
  if (search) {
    where.OR = [
      { email:     { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName:  { contains: search, mode: "insensitive" } },
    ];
  }

  const [learners, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        grade: true, province: true, school: true,
        lastActiveAt: true, accountStatus: true,
        assessmentSessions: {
          select: { assessmentType: true, status: true },
        },
        learnerProfile: {
          select: { riasecType: true, chosenCareerId: true, generatedAt: true },
        },
      },
      orderBy: { lastName: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data:   { learners, pagination: { total, page, pages: Math.ceil(total / limit) } },
  });
});

// ── At-risk learners (inactive or stalled) ────────────────────────────────────

export const atRiskLearners = catchAsync(async (req: Request, res: Response) => {
  const managerId = req.user!.userId;
  const cutoff    = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const learners = await prisma.user.findMany({
    where: {
      managerId,
      role:          "LEARNER",
      accountStatus: "ACTIVE",
      OR: [
        { lastActiveAt: { lt: cutoff } },
        { lastActiveAt: null },
      ],
    },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      lastActiveAt: true, grade: true,
      assessmentSessions: { select: { assessmentType: true, status: true } },
    },
    orderBy: { lastActiveAt: "asc" },
    take: 100,
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: learners });
});

// ── Assign learner to manager ──────────────────────────────────────────────────

export const assignLearner = catchAsync(async (req: Request, res: Response) => {
  const managerId  = req.user!.userId;
  const { learnerId } = req.body;
  if (!learnerId) throw new AppError("learnerId is required", HttpStatus.BAD_REQUEST);

  const learner = await prisma.user.findUnique({ where: { id: learnerId } });
  if (!learner || learner.role !== "LEARNER") throw new AppError("Learner not found", HttpStatus.NOT_FOUND);

  await prisma.user.update({ where: { id: learnerId }, data: { managerId } });
  return res.status(HttpStatus.OK).json({ status: "success", message: "Learner assigned" });
});

// ── Reports ────────────────────────────────────────────────────────────────────

export const learnerReport = catchAsync(async (req: Request, res: Response) => {
  const managerId = req.user!.userId;

  const learners = await prisma.user.findMany({
    where: { managerId, role: "LEARNER", accountStatus: { not: "DELETED" } },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      grade: true, province: true, school: true, lastActiveAt: true,
      assessmentSessions: { select: { assessmentType: true, status: true, completedAt: true } },
      learnerProfile:     { select: { riasecType: true, chosenCareerId: true } },
    },
    orderBy: { lastName: "asc" },
  });

  const completionRates = {
    INTEREST:    pct(learners, "INTEREST"),
    APTITUDE:    pct(learners, "APTITUDE"),
    PERSONALITY: pct(learners, "PERSONALITY"),
    VALUES:      pct(learners, "VALUES"),
  };

  return res.status(HttpStatus.OK).json({
    status: "success",
    data:   { learners, completionRates, total: learners.length },
  });
});

function pct(learners: any[], type: string): number {
  if (!learners.length) return 0;
  const done = learners.filter((l) =>
    l.assessmentSessions.some((s: any) => s.assessmentType === type && s.status === "COMPLETED")
  ).length;
  return Math.round((done / learners.length) * 100);
}
