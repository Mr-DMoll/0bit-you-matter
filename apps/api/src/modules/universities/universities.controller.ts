import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";

// ── Universities ───────────────────────────────────────────────────────────────

export const listUniversities = catchAsync(async (req: Request, res: Response) => {
  const page     = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit    = 50;
  const skip     = (page - 1) * limit;
  const province = req.query.province as string | undefined;
  const status   = req.query.status as string | undefined;

  const where: any = {};
  if (province) where.province = province;
  if (status) {
    const statuses = status.split(",").map((s) => s.trim()).filter(Boolean);
    where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
  }

  const [universities, total] = await Promise.all([
    prisma.university.findMany({
      where,
      include: { _count: { select: { programmes: true } } },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.university.count({ where }),
  ]);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data: { universities, pagination: { total, page, pages: Math.ceil(total / limit) } },
  });
});

export const getUniversity = catchAsync(async (req: Request, res: Response) => {
  const university = await prisma.university.findUnique({
    where:   { id: req.params.id },
    include: { programmes: { orderBy: { name: "asc" } } },
  });
  if (!university) throw new AppError("University not found", HttpStatus.NOT_FOUND);
  return res.status(HttpStatus.OK).json({ status: "success", data: university });
});

export const createUniversity = catchAsync(async (req: Request, res: Response) => {
  const { name, abbreviation, province, type, website, logoUrl } = req.body;
  if (!name || !province) throw new AppError("name and province are required", HttpStatus.BAD_REQUEST);

  const university = await prisma.university.create({
    data: { name, abbreviation, province, type, website, logoUrl },
  });
  return res.status(HttpStatus.CREATED).json({ status: "success", data: university });
});

export const updateUniversity = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const uni = await prisma.university.findUnique({ where: { id } });
  if (!uni) throw new AppError("University not found", HttpStatus.NOT_FOUND);

  const updated = await prisma.university.update({
    where: { id },
    data:  req.body,
  });
  return res.status(HttpStatus.OK).json({ status: "success", data: updated });
});

// ── Programmes ────────────────────────────────────────────────────────────────

export const listProgrammes = catchAsync(async (req: Request, res: Response) => {
  const { universityId } = req.params;
  const page   = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit  = 100;
  const apsMin = req.query.apsMin ? parseInt(req.query.apsMin as string) : undefined;
  const status = req.query.status as string | undefined;

  const where: any = { universityId };
  if (status)   where.status   = status;
  if (apsMin !== undefined) where.apsMin = { lte: apsMin };

  const [programmes, total] = await Promise.all([
    prisma.programme.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.programme.count({ where }),
  ]);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data: { programmes, pagination: { total, page, pages: Math.ceil(total / limit) } },
  });
});

export const createProgramme = catchAsync(async (req: Request, res: Response) => {
  const { universityId } = req.params;
  const {
    name, faculty, duration, nqfLevel,
    apsMin, subjectRequirements,
    applicationOpenDate, applicationCloseDate,
  } = req.body;

  if (!name) throw new AppError("name is required", HttpStatus.BAD_REQUEST);

  const programme = await prisma.programme.create({
    data: {
      universityId, name, faculty,
      duration: duration ? parseInt(duration) : undefined,
      nqfLevel: nqfLevel ? parseInt(nqfLevel) : undefined,
      apsMin:   apsMin   ? parseInt(apsMin)   : undefined,
      subjectRequirements,
      applicationOpenDate:  applicationOpenDate  ? new Date(applicationOpenDate)  : undefined,
      applicationCloseDate: applicationCloseDate ? new Date(applicationCloseDate) : undefined,
    },
  });
  return res.status(HttpStatus.CREATED).json({ status: "success", data: programme });
});

export const updateProgramme = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const prog = await prisma.programme.findUnique({ where: { id } });
  if (!prog) throw new AppError("Programme not found", HttpStatus.NOT_FOUND);

  const updated = await prisma.programme.update({ where: { id }, data: req.body });
  return res.status(HttpStatus.OK).json({ status: "success", data: updated });
});

// ── APS calculator (learner-facing) ───────────────────────────────────────────
// POST /universities/aps-check  { subjects: [{ subject, mark }] }

export const apsCheck = catchAsync(async (req: Request, res: Response) => {
  const { subjects } = req.body as { subjects: { subject: string; mark: number }[] };
  if (!Array.isArray(subjects) || subjects.length === 0)
    throw new AppError("subjects array is required", HttpStatus.BAD_REQUEST);

  // APS: sum of best 6 subject scores on a 7-point scale (excl. LO)
  const LO_SUBJECTS = ["life orientation", "lo"];
  const scored = subjects
    .filter((s) => !LO_SUBJECTS.includes(s.subject.toLowerCase()))
    .map((s) => ({
      subject: s.subject,
      mark:    s.mark,
      points:  markToAps(s.mark),
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 6);

  const apsScore = scored.reduce((sum, s) => sum + s.points, 0);

  const programmes = await prisma.programme.findMany({
    where: {
      apsMin:   { lte: apsScore },
      status:   { in: ["APPROVED", "VERIFIED"] },
    },
    include: {
      university: { select: { id: true, name: true, abbreviation: true, province: true } },
    },
    orderBy: { apsMin: "desc" },
    take: 100,
  });

  return res.status(HttpStatus.OK).json({
    status: "success",
    data:   { apsScore, breakdown: scored, qualifyingProgrammes: programmes },
  });
});

function markToAps(mark: number): number {
  if (mark >= 80) return 7;
  if (mark >= 70) return 6;
  if (mark >= 60) return 5;
  if (mark >= 50) return 4;
  if (mark >= 40) return 3;
  if (mark >= 30) return 2;
  return 1;
}
