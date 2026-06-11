import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";
import { contentGenerationQueue } from "../../lib/queues.js";
import { sendReviewAssignmentEmail } from "../../services/mail.service.js";

// ── Generation jobs ────────────────────────────────────────────────────────────

export const listGenerationJobs = catchAsync(async (req: Request, res: Response) => {
  const page   = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit  = 50;
  const status = req.query.status as string | undefined;
  const type   = req.query.type   as string | undefined;

  const where: any = {};
  if (status) where.status      = status;
  if (type)   where.contentType = type;

  const [jobs, total] = await Promise.all([
    prisma.generationJob.findMany({
      where,
      include: {
        requestedBy:    { select: { email: true, displayName: true } },
        promptTemplate: { select: { name: true, version: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.generationJob.count({ where }),
  ]);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data:   { jobs, pagination: { total, page, pages: Math.ceil(total / limit) } },
  });
});

export const createGenerationJob = catchAsync(async (req: Request, res: Response) => {
  const { contentType, parameters, promptTemplateId } = req.body;
  if (!contentType) throw new AppError("contentType is required", HttpStatus.BAD_REQUEST);

  const job = await prisma.generationJob.create({
    data: {
      contentType,
      parameters,
      promptTemplateId,
      requestedById: req.user!.userId,
      status: "QUEUED",
    },
  });

  await contentGenerationQueue.add("generate", { generationJobId: job.id });

  return res.status(HttpStatus.CREATED).json({ status: "success", data: job });
});

export const retryGenerationJob = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const job = await prisma.generationJob.findUnique({ where: { id } });
  if (!job) throw new AppError("Job not found", HttpStatus.NOT_FOUND);
  if (job.status !== "FAILED") throw new AppError("Only FAILED jobs can be retried", HttpStatus.BAD_REQUEST);

  const updated = await prisma.generationJob.update({
    where: { id },
    data:  { status: "QUEUED", retryCount: { increment: 1 }, errorLog: null },
  });
  await contentGenerationQueue.add("generate", { generationJobId: id });
  return res.status(HttpStatus.OK).json({ status: "success", data: updated });
});

// ── Prompt templates ───────────────────────────────────────────────────────────

export const listPromptTemplates = catchAsync(async (req: Request, res: Response) => {
  const type = req.query.type as string | undefined;
  const where: any = {};
  if (type) where.contentType = type;

  const templates = await prisma.promptTemplate.findMany({
    where,
    orderBy: [{ contentType: "asc" }, { version: "desc" }],
  });
  return res.status(HttpStatus.OK).json({ status: "success", data: templates });
});

export const createPromptTemplate = catchAsync(async (req: Request, res: Response) => {
  const { contentType, name, systemPrompt, userPrompt } = req.body;
  if (!contentType || !name || !systemPrompt || !userPrompt)
    throw new AppError("contentType, name, systemPrompt and userPrompt are required", HttpStatus.BAD_REQUEST);

  // Auto-increment version within type+name
  const latest = await prisma.promptTemplate.findFirst({
    where:   { contentType, name },
    orderBy: { version: "desc" },
  });

  // Deactivate old version
  if (latest) {
    await prisma.promptTemplate.update({ where: { id: latest.id }, data: { isActive: false } });
  }

  const template = await prisma.promptTemplate.create({
    data: {
      contentType, name, systemPrompt, userPrompt,
      version:  (latest?.version ?? 0) + 1,
      isActive: true,
    },
  });
  return res.status(HttpStatus.CREATED).json({ status: "success", data: template });
});

export const updatePromptTemplate = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const tpl = await prisma.promptTemplate.findUnique({ where: { id } });
  if (!tpl) throw new AppError("Template not found", HttpStatus.NOT_FOUND);

  const updated = await prisma.promptTemplate.update({ where: { id }, data: req.body });
  return res.status(HttpStatus.OK).json({ status: "success", data: updated });
});

// ── Review assignments ────────────────────────────────────────────────────────

export const listReviews = catchAsync(async (req: Request, res: Response) => {
  const page       = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit      = parseInt(req.query.limit as string) || 50;
  const status     = req.query.status     as string | undefined;
  const type       = req.query.type       as string | undefined;
  const reviewerId = req.query.reviewerId as string | undefined;
  const careerId   = req.query.careerId   as string | undefined;

  const where: any = {};
  if (status)     where.status      = status;
  if (type)       where.contentType = type;
  if (reviewerId) where.reviewerId  = reviewerId;
  if (careerId)   where.careerId    = careerId;

  // Reviewers only see their own queue
  if (req.user!.role === "REVIEWER") where.reviewerId = req.user!.userId;

  const [reviews, total] = await Promise.all([
    prisma.contentReview.findMany({
      where,
      include: {
        reviewer: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true } },
        career:   { select: { title: true, slug: true } },
        question: { select: { questionText: true, assessmentType: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contentReview.count({ where }),
  ]);

  // Attach tvetCollege name for TVET_COLLEGE reviews (entityId is a plain FK, no Prisma relation)
  const collegeIds = reviews
    .filter((r) => (r.contentType as string) === "TVET_COLLEGE" && r.entityId)
    .map((r) => r.entityId as string);

  const collegeMap = new Map<string, { id: string; name: string; province: string }>();
  if (collegeIds.length > 0) {
    const colleges = await prisma.tvetCollege.findMany({
      where:  { id: { in: collegeIds } },
      select: { id: true, name: true, province: true },
    });
    colleges.forEach((c) => collegeMap.set(c.id, c));
  }

  const enrichedReviews = reviews.map((r) => ({
    ...r,
    tvetCollege: r.entityId ? (collegeMap.get(r.entityId) ?? null) : null,
  }));

  return res.status(HttpStatus.OK).json({
    status: "success",
    data:   { reviews: enrichedReviews, pagination: { total, page, pages: Math.ceil(total / limit) } },
  });
});

export const getReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const review = await prisma.contentReview.findUnique({
    where: { id },
    include: {
      reviewer: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true } },
      career:   { select: { id: true, title: true, slug: true, overview: true, dayInTheLife: true, howToGetThere: true, saContext: true, riasecCodes: true, earningsMin: true, earningsMax: true, nqfLevelMin: true, cluster: { select: { name: true } }, status: true } },
      question: { select: { id: true, questionText: true, contextNote: true, riasecMapping: true, options: true, assessmentType: true, orderIndex: true, status: true } },
    },
  });

  if (!review) throw new AppError("Review not found", HttpStatus.NOT_FOUND);

  // Reviewers can only see their own reviews
  if (req.user!.role === "REVIEWER" && review.reviewerId !== req.user!.userId)
    throw new AppError("Access denied", HttpStatus.FORBIDDEN);

  // Auto-advance PENDING → IN_PROGRESS when the reviewer first opens it
  if (review.status === "PENDING" && req.user!.role === "REVIEWER") {
    await prisma.contentReview.update({ where: { id }, data: { status: "IN_PROGRESS" } });
    (review as any).status = "IN_PROGRESS";
  }

  // Attach entity data for non-career/question types (entityId is a plain FK, no Prisma relation)
  let tvetCollege = null;
  if ((review.contentType as string) === "TVET_COLLEGE" && review.entityId) {
    tvetCollege = await prisma.tvetCollege.findUnique({
      where:  { id: review.entityId },
      select: { id: true, name: true, abbreviation: true, province: true, collegeType: true, website: true, sourceUrl: true, verifiedNote: true, logoUrl: true, status: true },
    });
  }

  return res.status(HttpStatus.OK).json({ status: "success", data: { ...review, tvetCollege } });
});

export const assignReview = catchAsync(async (req: Request, res: Response) => {
  const { contentType, careerId, questionId, entityId, reviewerId, dueAt } = req.body;
  if (!contentType || !reviewerId)
    throw new AppError("contentType and reviewerId are required", HttpStatus.BAD_REQUEST);

  const reviewer = await prisma.user.findUnique({ where: { id: reviewerId } });
  if (!reviewer || reviewer.role !== "REVIEWER")
    throw new AppError("Reviewer not found", HttpStatus.NOT_FOUND);

  const review = await prisma.contentReview.create({
    data: {
      contentType, careerId, questionId, entityId, reviewerId,
      dueAt: dueAt ? new Date(dueAt) : undefined,
    },
  });

  // Send notification email (non-blocking)
  const reviewUrl = `${process.env.FRONTEND_URL ?? ""}/reviewer`;
  const title =
    careerId   ? (await prisma.career.findUnique({ where: { id: careerId },   select: { title: true } }))?.title ?? "Career"
    : questionId ? (await prisma.assessmentQuestion.findUnique({ where: { id: questionId }, select: { questionText: true } }))?.questionText?.slice(0, 60) ?? "Question"
    : contentType;
  sendReviewAssignmentEmail(
    reviewer.email,
    reviewer.displayName ?? reviewer.firstName ?? reviewer.email,
    [{ title, type: contentType }],
    reviewUrl,
  ).catch(() => {});

  return res.status(HttpStatus.CREATED).json({ status: "success", data: review });
});

export const assignReviewBulk = catchAsync(async (req: Request, res: Response) => {
  const {
    contentType, reviewerId, dueAt,
    questionIds, careerIds, pathwayIds, bursaryIds, collegeIds,
    assessmentType,
  } = req.body;

  if (!contentType || !reviewerId)
    throw new AppError("contentType and reviewerId are required", HttpStatus.BAD_REQUEST);

  const reviewer = await prisma.user.findUnique({ where: { id: reviewerId } });
  if (!reviewer || reviewer.role !== "REVIEWER")
    throw new AppError("Reviewer not found or not a REVIEWER role", HttpStatus.NOT_FOUND);

  // Resolve IDs from request body by content type
  let ids: string[] =
    contentType === "ASSESSMENT_QUESTION" ? (questionIds ?? []) :
    contentType === "CAREER"              ? (careerIds   ?? []) :
    contentType === "PATHWAY"             ? (pathwayIds  ?? []) :
    contentType === "BURSARY"             ? (bursaryIds  ?? []) :
    contentType === "TVET_COLLEGE" ? (collegeIds ?? []) : [];

  // If no IDs provided, auto-resolve all unreviewed items of that type
  if (ids.length === 0) {
    if (contentType === "ASSESSMENT_QUESTION") {
      const reviewed = await prisma.contentReview.findMany({
        where:  { contentType: "ASSESSMENT_QUESTION" },
        select: { questionId: true },
      });
      const reviewedIds = new Set(reviewed.map((r) => r.questionId).filter(Boolean));
      const qWhere: any = { status: "AI_GENERATED" };
      if (assessmentType) qWhere.assessmentType = assessmentType;
      const questions = await prisma.assessmentQuestion.findMany({ where: qWhere, select: { id: true } });
      ids = questions.map((q) => q.id).filter((id) => !reviewedIds.has(id));
    } else if (contentType === "CAREER") {
      const reviewed = await prisma.contentReview.findMany({
        where:  { contentType: "CAREER" },
        select: { careerId: true },
      });
      const reviewedIds = new Set(reviewed.map((r) => r.careerId).filter(Boolean));
      const careers = await prisma.career.findMany({ where: { status: "AI_GENERATED" }, select: { id: true } });
      ids = careers.map((c) => c.id).filter((id) => !reviewedIds.has(id));
    }
    // For PATHWAY / BURSARY / TVET_COLLEGE — caller must provide IDs explicitly
  }

  if (ids.length === 0)
    throw new AppError("No unreviewed items found to assign", HttpStatus.BAD_REQUEST);

  const dueDate = dueAt ? new Date(dueAt) : undefined;

  // Deduplicate — find IDs that already have a review
  const existingWhere: any = { contentType };
  if (contentType === "ASSESSMENT_QUESTION") existingWhere.questionId = { in: ids };
  else if (contentType === "CAREER")         existingWhere.careerId   = { in: ids };
  else                                       existingWhere.entityId   = { in: ids };

  const existingReviews = await prisma.contentReview.findMany({
    where: existingWhere,
    select: { questionId: true, careerId: true, entityId: true },
  });
  const alreadyReviewed = new Set(
    existingReviews.map((r) => r.questionId ?? r.careerId ?? r.entityId).filter(Boolean) as string[]
  );
  const newIds = ids.filter((id) => !alreadyReviewed.has(id));

  if (newIds.length === 0)
    throw new AppError("All selected items already have a reviewer assigned", HttpStatus.CONFLICT);

  await prisma.contentReview.createMany({
    data: newIds.map((id) => ({
      contentType,
      questionId: contentType === "ASSESSMENT_QUESTION" ? id : undefined,
      careerId:   contentType === "CAREER"              ? id : undefined,
      entityId:   !["ASSESSMENT_QUESTION", "CAREER"].includes(contentType) ? id : undefined,
      reviewerId,
      dueAt: dueDate,
    })),
  });

  // Move items to IN_REVIEW status
  if (contentType === "ASSESSMENT_QUESTION") {
    await prisma.assessmentQuestion.updateMany({
      where: { id: { in: newIds }, status: "AI_GENERATED" },
      data:  { status: "IN_REVIEW" },
    });
  } else if (contentType === "CAREER") {
    await prisma.career.updateMany({
      where: { id: { in: newIds }, status: "AI_GENERATED" },
      data:  { status: "IN_REVIEW" },
    });
  } else if (contentType === "PATHWAY") {
    await prisma.pathway.updateMany({
      where: { id: { in: newIds } },
      data:  { status: "IN_REVIEW" },
    });
  } else if (contentType === "BURSARY") {
    await prisma.bursary.updateMany({
      where: { id: { in: newIds } },
      data:  { status: "IN_REVIEW" },
    });
  } else if (contentType === "TVET_COLLEGE") {
    await prisma.tvetCollege.updateMany({
      where: { id: { in: newIds } },
      data:  { status: "IN_REVIEW" },
    });
  }

  // Send notification email with content titles (non-blocking)
  const reviewUrl = `${process.env.FRONTEND_URL ?? ""}/reviewer`;
  (async () => {
    try {
      let emailItems: { title: string; type: string }[] = [];
      if (contentType === "CAREER") {
        const careers = await prisma.career.findMany({ where: { id: { in: newIds } }, select: { title: true } });
        emailItems = careers.map((c) => ({ title: c.title ?? "Career", type: "Career" }));
      } else if (contentType === "ASSESSMENT_QUESTION") {
        const qs = await prisma.assessmentQuestion.findMany({ where: { id: { in: newIds } }, select: { questionText: true } });
        emailItems = qs.map((q) => ({ title: (q.questionText ?? "Question").slice(0, 60), type: "Assessment" }));
      } else {
        emailItems = newIds.map(() => ({ title: contentType, type: contentType }));
      }
      await sendReviewAssignmentEmail(
        reviewer.email,
        reviewer.displayName ?? reviewer.firstName ?? reviewer.email,
        emailItems,
        reviewUrl,
      );
    } catch { /* email failure should not affect the response */ }
  })();

  return res.status(HttpStatus.CREATED).json({
    status: "success",
    data: {
      assigned: newIds.length,
      reviewerName: reviewer.displayName ?? reviewer.email,
      message: `${newIds.length} item${newIds.length !== 1 ? "s" : ""} assigned to ${reviewer.displayName ?? reviewer.email}`,
    },
  });
});

export const submitReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const review = await prisma.contentReview.findUnique({ where: { id } });
  if (!review) throw new AppError("Review not found", HttpStatus.NOT_FOUND);

  if (review.reviewerId !== req.user!.userId && !["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"].includes(req.user!.role))
    throw new AppError("Forbidden", HttpStatus.FORBIDDEN);

  const { decision, confidenceRating, notes, trackedChanges, draft } = req.body;

  // ── DRAFT mode: save progress without finalising ──────────────────────────
  if (draft) {
    const saved = await prisma.contentReview.update({
      where: { id },
      data: {
        status:           "IN_PROGRESS",
        confidenceRating: confidenceRating ? parseInt(confidenceRating) : undefined,
        notes:            notes ?? undefined,
        trackedChanges:   trackedChanges ?? undefined,
      },
    });
    return res.status(HttpStatus.OK).json({ status: "success", data: saved });
  }

  // ── PUBLISH mode: finalise decision ───────────────────────────────────────
  if (!decision) throw new AppError("decision is required (VERIFIED or DISCARDED)", HttpStatus.BAD_REQUEST);
  if (!["VERIFIED", "DISCARDED"].includes(decision))
    throw new AppError("decision must be VERIFIED or DISCARDED", HttpStatus.BAD_REQUEST);

  const now = new Date();
  const reviewStatus  = decision === "VERIFIED" ? "APPROVED" : "REJECTED";
  const previousStatus = review.status; // PENDING | IN_PROGRESS | APPROVED | REJECTED

  const updated = await prisma.contentReview.update({
    where: { id },
    data: {
      status:           reviewStatus,
      confidenceRating: confidenceRating ? parseInt(confidenceRating) : undefined,
      notes,
      trackedChanges,
      completedAt: now,
    },
  });

  const reviewerId = req.user!.userId;
  const entityId   = (review as any).entityId as string | null | undefined;
  const ct         = review.contentType as string;

  // Helper — update entity content status
  const setContentStatus = async (status: string) => {
    if (review.careerId)   await prisma.career.update({ where: { id: review.careerId! }, data: { status: status as any, ...(status === "VERIFIED" ? { lastVerifiedAt: now, lastVerifiedBy: reviewerId } : {}) } }).catch(() => {});
    if (review.questionId) await prisma.assessmentQuestion.update({ where: { id: review.questionId! }, data: { status: status as any } }).catch(() => {});
    if (entityId) {
      if (ct === "BURSARY")      await prisma.bursary.update({ where: { id: entityId }, data: { status: status as any } }).catch(() => {});
      if (ct === "PATHWAY")      await prisma.pathway.update({ where: { id: entityId }, data: { status: status as any } }).catch(() => {});
      if (ct === "TVET_COLLEGE") await prisma.tvetCollege.update({ where: { id: entityId }, data: { status: status as any } }).catch(() => {});
    }
  };

  // Re-edit: reverse previous content status if the decision changed
  if (previousStatus === "APPROVED" && decision === "DISCARDED") {
    // Was VERIFIED — now being discarded
    await setContentStatus("ARCHIVED");
  } else if (previousStatus === "REJECTED" && decision === "VERIFIED") {
    // Was ARCHIVED — now being verified
    await setContentStatus("VERIFIED");
  } else if (previousStatus !== "APPROVED" && previousStatus !== "REJECTED") {
    // Fresh publish (first time)
    await setContentStatus(decision === "VERIFIED" ? "VERIFIED" : "ARCHIVED");
  }
  // Same decision re-submitted: content already at correct status, skip update

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: reviewerId,
      action: decision === "VERIFIED" ? "CONTENT_VERIFIED" : "CONTENT_DISCARDED",
      meta: { reviewId: id, contentType: review.contentType, careerId: review.careerId, questionId: review.questionId, entityId, notes, confidenceRating, resubmit: previousStatus !== "PENDING" && previousStatus !== "IN_PROGRESS" },
    },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: updated });
});

// ── Data verifications ────────────────────────────────────────────────────────

export const listVerifications = catchAsync(async (req: Request, res: Response) => {
  const page   = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit  = 50;
  const status = req.query.status as string | undefined;
  const type   = req.query.type   as string | undefined;

  const where: any = {};
  if (status) where.status      = status;
  if (type)   where.contentType = type;

  if (req.user!.role === "DATA_VERIFIER") where.verifierId = req.user!.userId;

  const [verifications, total] = await Promise.all([
    prisma.dataVerification.findMany({
      where,
      include: {
        verifier:  { select: { email: true, displayName: true } },
        career:    { select: { title: true } },
        programme: { select: { name: true, university: { select: { name: true } } } },
        bursary:   { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.dataVerification.count({ where }),
  ]);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data:   { verifications, pagination: { total, page, pages: Math.ceil(total / limit) } },
  });
});

export const assignVerification = catchAsync(async (req: Request, res: Response) => {
  const { contentType, careerId, programmeId, bursaryId, verifierId } = req.body;
  if (!contentType || !verifierId)
    throw new AppError("contentType and verifierId are required", HttpStatus.BAD_REQUEST);

  const verifier = await prisma.user.findUnique({ where: { id: verifierId } });
  if (!verifier || verifier.role !== "DATA_VERIFIER")
    throw new AppError("Data verifier not found", HttpStatus.NOT_FOUND);

  const verification = await prisma.dataVerification.create({
    data: { contentType, careerId, programmeId, bursaryId, verifierId },
  });
  return res.status(HttpStatus.CREATED).json({ status: "success", data: verification });
});

export const submitVerification = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const v = await prisma.dataVerification.findUnique({ where: { id } });
  if (!v) throw new AppError("Verification not found", HttpStatus.NOT_FOUND);

  if (v.verifierId !== req.user!.userId && !["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"].includes(req.user!.role))
    throw new AppError("Forbidden", HttpStatus.FORBIDDEN);

  const { status, sourceUrl, sourceNotes, verifiedFields } = req.body;

  const updated = await prisma.dataVerification.update({
    where: { id },
    data: {
      status,
      sourceUrl,
      sourceNotes,
      verifiedFields,
      verifiedAt: status === "VERIFIED" ? new Date() : undefined,
    },
  });

  // Mark the underlying content as VERIFIED if fully verified
  if (status === "VERIFIED") {
    const now = new Date();
    if (v.careerId)    await prisma.career.update({ where: { id: v.careerId }, data: { status: "VERIFIED", lastVerifiedAt: now, lastVerifiedBy: req.user!.userId } });
    if (v.programmeId) await prisma.programme.update({ where: { id: v.programmeId }, data: { status: "VERIFIED", lastVerifiedAt: now } });
    if (v.bursaryId)   await prisma.bursary.update({ where: { id: v.bursaryId }, data: { status: "VERIFIED", lastVerifiedAt: now } });
  }

  return res.status(HttpStatus.OK).json({ status: "success", data: updated });
});

// ── Source library ────────────────────────────────────────────────────────────

export const listSources = catchAsync(async (req: Request, res: Response) => {
  const type     = req.query.type     as string | undefined;
  const isActive = req.query.isActive as string | undefined;

  const where: any = {};
  if (type)     where.type     = type;
  if (isActive !== undefined) where.isActive = isActive === "true";

  const sources = await prisma.source.findMany({
    where,
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
  return res.status(HttpStatus.OK).json({ status: "success", data: sources });
});

export const createSource = catchAsync(async (req: Request, res: Response) => {
  const { name, url, type } = req.body;
  if (!name || !url || !type) throw new AppError("name, url and type are required", HttpStatus.BAD_REQUEST);

  const source = await prisma.source.create({ data: req.body });
  return res.status(HttpStatus.CREATED).json({ status: "success", data: source });
});

export const updateSource = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const src = await prisma.source.findUnique({ where: { id } });
  if (!src) throw new AppError("Source not found", HttpStatus.NOT_FOUND);

  const updated = await prisma.source.update({ where: { id }, data: req.body });
  return res.status(HttpStatus.OK).json({ status: "success", data: updated });
});
