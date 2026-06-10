import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";

export const listPathways = catchAsync(async (req: Request, res: Response) => {
  const careerId = req.query.careerId as string | undefined;
  const type     = req.query.type     as string | undefined;
  const status   = req.query.status   as string | undefined;
  const page     = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit    = 50;

  const where: any = { status: { not: "ARCHIVED" } };
  if (careerId) where.careerId = careerId;
  if (type)     where.type     = type;
  if (status)   where.status   = status;

  const [pathways, total] = await Promise.all([
    prisma.pathway.findMany({
      where,
      include: { career: { select: { id: true, title: true, cluster: { select: { name: true } } } } },
      orderBy: [{ careerId: "asc" }, { type: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.pathway.count({ where }),
  ]);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data: { pathways, pagination: { total, page, pages: Math.ceil(total / limit) } },
  });
});

export const getPathway = catchAsync(async (req: Request, res: Response) => {
  const pathway = await prisma.pathway.findUnique({
    where:   { id: req.params.id },
    include: { career: { select: { id: true, title: true, cluster: { select: { name: true } } } } },
  });
  if (!pathway) throw new AppError("Pathway not found", HttpStatus.NOT_FOUND);
  return res.status(HttpStatus.OK).json({ status: "success", data: pathway });
});

export const createPathway = catchAsync(async (req: Request, res: Response) => {
  const { careerId, type, title } = req.body;
  if (!careerId || !type || !title)
    throw new AppError("careerId, type and title are required", HttpStatus.BAD_REQUEST);

  const pathway = await prisma.pathway.create({ data: req.body });
  return res.status(HttpStatus.CREATED).json({ status: "success", data: pathway });
});

export const updatePathway = catchAsync(async (req: Request, res: Response) => {
  const p = await prisma.pathway.findUnique({ where: { id: req.params.id } });
  if (!p) throw new AppError("Pathway not found", HttpStatus.NOT_FOUND);

  const updated = await prisma.pathway.update({ where: { id: req.params.id }, data: req.body });
  return res.status(HttpStatus.OK).json({ status: "success", data: updated });
});

// Learner-facing: get all pathways for a career, grouped by type
export const getCareerPathways = catchAsync(async (req: Request, res: Response) => {
  const { careerId } = req.params;

  const pathways = await prisma.pathway.findMany({
    where:   { careerId, status: { in: ["APPROVED", "VERIFIED"] } },
    orderBy: { durationMonths: "asc" },
  });

  // Group by type for easy rendering
  const grouped = {
    UNIVERSITY:  pathways.filter((p) => p.type === "UNIVERSITY"),
    TVET:        pathways.filter((p) => p.type === "TVET"),
    LEARNERSHIP: pathways.filter((p) => p.type === "LEARNERSHIP"),
    DIRECT:      pathways.filter((p) => p.type === "DIRECT"),
  };

  return res.status(HttpStatus.OK).json({ status: "success", data: { pathways, grouped } });
});
