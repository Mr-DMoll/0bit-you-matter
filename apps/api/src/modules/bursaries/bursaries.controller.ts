import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";
import { bursaryScraperQueue } from "../../lib/queues.js";
import { SA_BURSARY_SOURCES } from "../../agents/bursaryScraper.agent.js";

export const listBursaries = catchAsync(async (req: Request, res: Response) => {
  const page   = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit  = 50;
  const skip   = (page - 1) * limit;
  const status = req.query.status as string | undefined;
  const field  = req.query.field  as string | undefined;

  const where: any = {};
  if (status) where.status = status;
  if (field)  where.fieldsOfStudy = { has: field };

  const role = req.user?.role;
  const isPublic = !role || role === "LEARNER";

  if (isPublic) {
    // Learners only see published, non-expired bursaries
    where.status = { in: ["APPROVED", "VERIFIED"] };
    where.OR = [
      { closeDate: null },
      { closeDate: { gte: new Date() } },
    ];
  } else {
    // Admins never see ARCHIVED bursaries (removed by reviewers) unless explicitly filtering
    if (!status) where.status = { not: "ARCHIVED" };
  }

  const [bursaries, total] = await Promise.all([
    prisma.bursary.findMany({
      where,
      orderBy: [{ closeDate: "asc" }, { name: "asc" }],
      skip,
      take: limit,
    }),
    prisma.bursary.count({ where }),
  ]);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data:   { bursaries, pagination: { total, page, pages: Math.ceil(total / limit) } },
  });
});

export const getBursary = catchAsync(async (req: Request, res: Response) => {
  const role = req.user?.role;
  const bursary = await prisma.bursary.findUnique({ where: { id: req.params.id } });
  if (!bursary) throw new AppError("Bursary not found", HttpStatus.NOT_FOUND);
  // Public users only see published bursaries
  if (!role || role === "LEARNER") {
    if (!["APPROVED", "VERIFIED"].includes(bursary.status)) {
      throw new AppError("Bursary not found", HttpStatus.NOT_FOUND);
    }
  }
  return res.status(HttpStatus.OK).json({ status: "success", data: bursary });
});

export const createBursary = catchAsync(async (req: Request, res: Response) => {
  const { name, provider } = req.body;
  if (!name || !provider) throw new AppError("name and provider are required", HttpStatus.BAD_REQUEST);

  const bursary = await prisma.bursary.create({
    data: {
      name, provider,
      description:         req.body.description,
      amount:              req.body.amount,
      fieldsOfStudy:       req.body.fieldsOfStudy ?? [],
      eligibilityCriteria: req.body.eligibilityCriteria,
      applicationUrl:      req.body.applicationUrl,
      openDate:            req.body.openDate  ? new Date(req.body.openDate)  : undefined,
      closeDate:           req.body.closeDate ? new Date(req.body.closeDate) : undefined,
      sourceUrl:           req.body.sourceUrl,
    },
  });
  return res.status(HttpStatus.CREATED).json({ status: "success", data: bursary });
});

export const updateBursary = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const bursary = await prisma.bursary.findUnique({ where: { id } });
  if (!bursary) throw new AppError("Bursary not found", HttpStatus.NOT_FOUND);

  const updated = await prisma.bursary.update({ where: { id }, data: req.body });
  return res.status(HttpStatus.OK).json({ status: "success", data: updated });
});

// ── Bursary scraper ────────────────────────────────────────────────────────────

export const listBursarySources = catchAsync(async (_req: Request, res: Response) => {
  return res.status(HttpStatus.OK).json({ status: "success", data: SA_BURSARY_SOURCES });
});

export const triggerBursaryScrape = catchAsync(async (req: Request, res: Response) => {
  const { sourceKey } = req.body;
  if (!sourceKey) throw new AppError("sourceKey is required", HttpStatus.BAD_REQUEST);

  const source = SA_BURSARY_SOURCES.find((s) => s.key === sourceKey);
  if (!source) throw new AppError(`Unknown source: ${sourceKey}`, HttpStatus.BAD_REQUEST);

  // Create a generation job record so the UI can track progress
  const job = await prisma.generationJob.create({
    data: {
      contentType:   "BURSARY",
      parameters:    { sourceKey, sourceLabel: source.label, sourceUrl: source.url },
      requestedById: req.user!.userId,
      status:        "QUEUED",
    },
  });

  await bursaryScraperQueue.add("scrape", {
    sourceKey,
    generationJobId: job.id,
  });

  return res.status(HttpStatus.CREATED).json({
    status: "success",
    data:   { job, message: `Scrape queued for ${source.label}` },
  });
});

// ── Sync test scrape — bypasses queue, returns full result for debugging ──────
export const testScrape = catchAsync(async (req: Request, res: Response) => {
  const { sourceKey } = req.params;
  const { runBursaryScraperAgent } = await import("../../agents/bursaryScraper.agent.js");
  const result = await runBursaryScraperAgent(sourceKey);
  return res.status(HttpStatus.OK).json({ status: "success", data: result });
});

// ── Deadlines coming up in the next N days ────────────────────────────────────
export const upcomingDeadlines = catchAsync(async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const bursaries = await prisma.bursary.findMany({
    where: {
      closeDate: { gte: new Date(), lte: cutoff },
      status:    { in: ["APPROVED", "VERIFIED"] },
    },
    orderBy: { closeDate: "asc" },
    take: 50,
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: bursaries });
});
