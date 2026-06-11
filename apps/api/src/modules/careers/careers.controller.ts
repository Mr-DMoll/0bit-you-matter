import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";

// ── Clusters ───────────────────────────────────────────────────────────────────

export const listClusters = catchAsync(async (_req: Request, res: Response) => {
  const clusters = await prisma.careerCluster.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { careers: true } } },
  });
  return res.status(HttpStatus.OK).json({ status: "success", data: clusters });
});

export const createCluster = catchAsync(async (req: Request, res: Response) => {
  const { name, slug, description, iconName, colorHex } = req.body;
  if (!name || !slug) throw new AppError("name and slug are required", HttpStatus.BAD_REQUEST);

  const cluster = await prisma.careerCluster.create({
    data: { name, slug, description, iconName, colorHex },
  });
  return res.status(HttpStatus.CREATED).json({ status: "success", data: cluster });
});

// ── Careers ────────────────────────────────────────────────────────────────────

export const listCareers = catchAsync(async (req: Request, res: Response) => {
  const page      = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit     = 50;
  const skip      = (page - 1) * limit;
  const status    = req.query.status as string | undefined;
  const clusterId = req.query.clusterId as string | undefined;
  const search    = req.query.search as string | undefined;

  const role     = (req as any).user?.role;
  const isPublic = !role || role === "LEARNER";

  const where: any = {};
  if (isPublic) {
    // Learners only see reviewer-verified or admin-approved careers
    where.status = status ? status : { in: ["APPROVED", "VERIFIED"] };
  } else {
    if (status) where.status = status;
  }
  if (clusterId) where.clusterId = clusterId;
  if (search)    where.title     = { contains: search, mode: "insensitive" };

  const [careers, total] = await Promise.all([
    prisma.career.findMany({
      where,
      include: { cluster: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.career.count({ where }),
  ]);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data:   { careers, pagination: { total, page, pages: Math.ceil(total / limit) } },
  });
});

export const getCareer = catchAsync(async (req: Request, res: Response) => {
  const career = await prisma.career.findUnique({
    where:   { slug: req.params.slug },
    include: { cluster: true },
  });
  if (!career) throw new AppError("Career not found", HttpStatus.NOT_FOUND);

  await prisma.career.update({ where: { id: career.id }, data: { viewCount: { increment: 1 } } });

  return res.status(HttpStatus.OK).json({ status: "success", data: career });
});

export const createCareer = catchAsync(async (req: Request, res: Response) => {
  const {
    title, slug, clusterId, riasecCodes,
    overview, dayInTheLife, howToGetThere,
    earningsMin, earningsMax, earningsCurrency, earningsNote,
    nqfLevelMin, saContext,
  } = req.body;

  if (!title || !slug || !clusterId)
    throw new AppError("title, slug and clusterId are required", HttpStatus.BAD_REQUEST);

  const career = await prisma.career.create({
    data: {
      title, slug, clusterId,
      riasecCodes: riasecCodes ?? [],
      overview, dayInTheLife, howToGetThere,
      earningsMin, earningsMax,
      earningsCurrency: earningsCurrency ?? "ZAR",
      earningsNote, nqfLevelMin, saContext,
      generatedById: req.user!.userId,
    },
  });
  return res.status(HttpStatus.CREATED).json({ status: "success", data: career });
});

export const updateCareer = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const career = await prisma.career.findUnique({ where: { id } });
  if (!career) throw new AppError("Career not found", HttpStatus.NOT_FOUND);

  const {
    title, slug, clusterId, riasecCodes, status,
    overview, dayInTheLife, howToGetThere,
    earningsMin, earningsMax, earningsCurrency, earningsNote,
    nqfLevelMin, saContext, qualityScore,
  } = req.body;

  const updated = await prisma.career.update({
    where: { id },
    data: {
      title, slug, clusterId, riasecCodes, status,
      overview, dayInTheLife, howToGetThere,
      earningsMin, earningsMax, earningsCurrency, earningsNote,
      nqfLevelMin, saContext, qualityScore,
    },
  });
  return res.status(HttpStatus.OK).json({ status: "success", data: updated });
});

export const deleteCareer = catchAsync(async (req: Request, res: Response) => {
  const career = await prisma.career.findUnique({ where: { id: req.params.id } });
  if (!career) throw new AppError("Career not found", HttpStatus.NOT_FOUND);
  await prisma.career.update({ where: { id: req.params.id }, data: { status: "ARCHIVED" } });
  return res.status(HttpStatus.OK).json({ status: "success", message: "Career archived" });
});

// ── Coverage stats (admin/content manager) ────────────────────────────────────

export const coverageStats = catchAsync(async (_req: Request, res: Response) => {
  const clusters = await prisma.careerCluster.findMany({
    include: {
      _count: { select: { careers: true } },
      careers: {
        select: { status: true },
      },
    },
  });

  const stats = clusters.map((c) => ({
    id:       c.id,
    name:     c.name,
    slug:     c.slug,
    total:    c._count.careers,
    verified: c.careers.filter((x) => x.status === "VERIFIED").length,
    approved: c.careers.filter((x) => x.status === "APPROVED").length,
    inReview: c.careers.filter((x) => x.status === "IN_REVIEW").length,
    aiGenerated: c.careers.filter((x) => x.status === "AI_GENERATED").length,
  }));

  return res.status(HttpStatus.OK).json({ status: "success", data: stats });
});
