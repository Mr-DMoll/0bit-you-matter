import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";

// ── TVET Colleges ──────────────────────────────────────────────────────────────

export const listColleges = catchAsync(async (req: Request, res: Response) => {
  const page        = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit       = 50;
  const province    = req.query.province    as string | undefined;
  const status      = req.query.status      as string | undefined;
  const search      = req.query.search      as string | undefined;
  const collegeType = req.query.collegeType as string | undefined;

  const where: any = {};
  if (province)    where.province    = province;
  if (status) {
    const statuses = status.split(",").map((s) => s.trim()).filter(Boolean);
    where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
  }
  if (collegeType) where.collegeType = collegeType;
  if (search)      where.name        = { contains: search, mode: "insensitive" };

  const [colleges, total] = await Promise.all([
    prisma.tvetCollege.findMany({
      where,
      include: { _count: { select: { programmes: true } } },
      orderBy: [{ province: "asc" }, { name: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.tvetCollege.count({ where }),
  ]);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data: { colleges, pagination: { total, page, pages: Math.ceil(total / limit) } },
  });
});

export const getCollege = catchAsync(async (req: Request, res: Response) => {
  const college = await prisma.tvetCollege.findUnique({
    where:   { id: req.params.id },
    include: {
      programmes: {
        where:   { status: { not: "ARCHIVED" } },
        orderBy: [{ programmeType: "asc" }, { field: "asc" }, { name: "asc" }],
      },
    },
  });
  if (!college) throw new AppError("TVET college not found", HttpStatus.NOT_FOUND);
  return res.status(HttpStatus.OK).json({ status: "success", data: college });
});

export const createCollege = catchAsync(async (req: Request, res: Response) => {
  const { name, abbreviation, province, website, sourceUrl, collegeType } = req.body;
  if (!name || !province) throw new AppError("name and province are required", HttpStatus.BAD_REQUEST);

  const college = await prisma.tvetCollege.create({
    data: { name, abbreviation, province, website, sourceUrl, collegeType: collegeType ?? "PUBLIC", status: "IN_REVIEW" },
  });
  return res.status(HttpStatus.CREATED).json({ status: "success", data: college });
});

export const updateCollege = catchAsync(async (req: Request, res: Response) => {
  const col = await prisma.tvetCollege.findUnique({ where: { id: req.params.id } });
  if (!col) throw new AppError("College not found", HttpStatus.NOT_FOUND);

  const updated = await prisma.tvetCollege.update({ where: { id: req.params.id }, data: req.body });
  return res.status(HttpStatus.OK).json({ status: "success", data: updated });
});

// ── TVET Programmes ────────────────────────────────────────────────────────────

export const listProgrammes = catchAsync(async (req: Request, res: Response) => {
  const { collegeId } = req.params;
  const field         = req.query.field         as string | undefined;
  const programmeType = req.query.programmeType as string | undefined;

  const where: any = { collegeId, status: { not: "ARCHIVED" } };
  if (field)         where.field         = { contains: field, mode: "insensitive" };
  if (programmeType) where.programmeType = programmeType;

  const programmes = await prisma.tvetProgramme.findMany({
    where,
    orderBy: [{ programmeType: "asc" }, { field: "asc" }, { name: "asc" }],
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: programmes });
});

export const createProgramme = catchAsync(async (req: Request, res: Response) => {
  const { collegeId } = req.params;
  const { name, programmeType, field, ncvLevel, natedLevel, duration, entryRequirement, description, careerOutcomes, subjectRequirements, sourceUrl } = req.body;

  if (!name || !programmeType || !field)
    throw new AppError("name, programmeType and field are required", HttpStatus.BAD_REQUEST);

  const programme = await prisma.tvetProgramme.create({
    data: {
      collegeId, name, programmeType, field,
      ncvLevel:   ncvLevel   ? parseInt(ncvLevel)   : undefined,
      duration:   duration   ? parseInt(duration)   : undefined,
      natedLevel, entryRequirement, description,
      careerOutcomes: careerOutcomes ?? [],
      subjectRequirements, sourceUrl,
    },
  });
  return res.status(HttpStatus.CREATED).json({ status: "success", data: programme });
});

export const updateProgramme = catchAsync(async (req: Request, res: Response) => {
  const prog = await prisma.tvetProgramme.findUnique({ where: { id: req.params.id } });
  if (!prog) throw new AppError("Programme not found", HttpStatus.NOT_FOUND);

  const updated = await prisma.tvetProgramme.update({ where: { id: req.params.id }, data: req.body });
  return res.status(HttpStatus.OK).json({ status: "success", data: updated });
});
