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

export const retryAllFailedJobs = catchAsync(async (req: Request, res: Response) => {
  const { contentType } = req.query;
  const where: any = { status: "FAILED" };
  if (contentType) where.contentType = contentType;

  const failedJobs = await prisma.generationJob.findMany({ where, select: { id: true } });
  if (failedJobs.length === 0)
    return res.status(HttpStatus.OK).json({ status: "success", data: { retried: 0 } });

  await prisma.generationJob.updateMany({
    where: { id: { in: failedJobs.map((j) => j.id) } },
    data:  { status: "QUEUED", errorLog: null },
  });

  for (const job of failedJobs) {
    await contentGenerationQueue.add("generate", { generationJobId: job.id });
  }

  return res.status(HttpStatus.OK).json({
    status: "success",
    data: { retried: failedJobs.length, message: `${failedJobs.length} jobs re-queued` },
  });
});

export const seedTestPathways = catchAsync(async (req: Request, res: Response) => {
  // For testing: directly create verified pathways for the first N careers that have none
  const limit = Math.min(parseInt(req.query.limit as string) || 5, 20);

  // Find careers with no pathways yet
  const careers = await prisma.career.findMany({
    where:   { status: { in: ["VERIFIED", "APPROVED"] } },
    take:    limit * 3, // fetch extra in case some already have pathways
    orderBy: { createdAt: "asc" },
    select:  { id: true, title: true },
  });

  const seeded: string[] = [];

  for (const career of careers) {
    if (seeded.length >= limit) break;

    const existing = await prisma.pathway.count({ where: { careerId: career.id } });
    if (existing > 0) continue;

    // Create a UNIVERSITY pathway
    await prisma.pathway.create({
      data: {
        careerId:          career.id,
        type:              "UNIVERSITY",
        title:             `Become a ${career.title} via University`,
        durationLabel:     "3–4 years",
        durationMonths:    42,
        estimatedCostMin:  40000,
        estimatedCostMax:  80000,
        costNote:          "NSFAS covers tuition + accommodation for qualifying students",
        earnWhileLearn:    false,
        entryRequirements: "Grade 12 with a minimum APS of 28. Mathematics and English required.",
        apsMin:            28,
        gradeMin:          12,
        steps: [
          { step: 1, title: "Pass Grade 12", description: "Achieve a minimum APS of 28 with Maths and English.", duration: "1 year" },
          { step: 2, title: "Apply to university", description: "Apply to a South African university offering a relevant undergraduate degree. Apply for NSFAS if you qualify.", duration: "6 months" },
          { step: 3, title: "Complete your degree", description: "Study a 3–4 year Bachelor's degree in a relevant field.", duration: "3–4 years" },
          { step: 4, title: "Graduate & enter the field", description: "Apply for graduate programmes or entry-level positions. Many employers offer bursaries to final-year students.", duration: "Ongoing" },
        ],
        fundingOptions:     ["NSFAS", "Company Bursary", "Merit Scholarship"],
        setaName:           null,
        qualificationEarned: "Bachelor's Degree (NQF 7)",
        nqfLevelEarned:     7,
        employmentNote:     "Most employers require a relevant degree as a minimum. Graduate unemployment rate is lower than the national average.",
        pros:               ["Internationally recognised qualification", "NSFAS funding available", "Wide range of universities"],
        cons:               ["3–4 year commitment", "Competitive entry requirements", "Student loan debt if not on NSFAS"],
        status:             "VERIFIED",
      },
    });

    // Also create a TVET pathway
    await prisma.pathway.create({
      data: {
        careerId:          career.id,
        type:              "TVET",
        title:             `Become a ${career.title} via TVET College`,
        durationLabel:     "2–3 years",
        durationMonths:    30,
        estimatedCostMin:  5000,
        estimatedCostMax:  15000,
        costNote:          "NSFAS covers TVET fees for qualifying students. DHET also offers TVET bursaries.",
        earnWhileLearn:    false,
        entryRequirements: "Grade 10 pass minimum. Grade 12 preferred for N4 and above.",
        apsMin:            null,
        gradeMin:          10,
        steps: [
          { step: 1, title: "Enrol at a TVET college", description: "Apply to any public TVET college offering the relevant NCV or NATED programme.", duration: "1 month" },
          { step: 2, title: "Complete your NATED programme (N4–N6)", description: "Study a 3-term NATED N4, N5, and N6 programme (18 months full-time).", duration: "18 months" },
          { step: 3, title: "Gain 18 months work experience", description: "Complete 18 months of relevant work experience to qualify for your N6 National Certificate.", duration: "18 months" },
          { step: 4, title: "Enter the workforce", description: "Apply for entry-level positions. Many employers actively recruit TVET graduates.", duration: "Ongoing" },
        ],
        fundingOptions:     ["NSFAS", "DHET TVET Bursary", "SETA Bursary"],
        setaName:           null,
        qualificationEarned: "N6 National Certificate (NQF 5)",
        nqfLevelEarned:     5,
        employmentNote:     "TVET graduates are in high demand. Many companies partner directly with TVET colleges for recruitment.",
        pros:               ["More affordable than university", "NSFAS available", "Practical skills focus", "Faster entry into the workforce"],
        cons:               ["May need top-up degree for senior roles", "N6 requires work experience component"],
        status:             "VERIFIED",
      },
    });

    seeded.push(career.title);
  }

  return res.status(HttpStatus.OK).json({
    status:  "success",
    data:    { seeded: seeded.length, careers: seeded, message: `Created UNIVERSITY + TVET pathways for ${seeded.length} careers (verified, ready to view)` },
  });
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
  const status         = req.query.status         as string | undefined;
  const type           = req.query.type           as string | undefined;
  const reviewerId     = req.query.reviewerId     as string | undefined;
  const careerId       = req.query.careerId       as string | undefined;
  const assessmentType = req.query.assessmentType as string | undefined;

  const where: any = {};
  if (status)     where.status      = status;
  if (type)       where.contentType = type;
  if (reviewerId) where.reviewerId  = reviewerId;
  if (careerId)   where.careerId    = careerId;
  // Sub-filter: when viewing ASSESSMENT_QUESTION reviews, filter by the question's assessmentType
  if (assessmentType) where.question = { assessmentType };

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

  // Batch-fetch entity names for non-career/question types
  const byType = (type: string) =>
    reviews.filter((r) => (r.contentType as string) === type && r.entityId).map((r) => r.entityId as string);

  const [colleges, bursaries, pathways] = await Promise.all([
    byType("TVET_COLLEGE").length > 0
      ? prisma.tvetCollege.findMany({ where: { id: { in: byType("TVET_COLLEGE") } }, select: { id: true, name: true, province: true } })
      : Promise.resolve([]),
    byType("BURSARY").length > 0
      ? prisma.bursary.findMany({ where: { id: { in: byType("BURSARY") } }, select: { id: true, name: true, provider: true } })
      : Promise.resolve([]),
    byType("PATHWAY").length > 0
      ? prisma.pathway.findMany({ where: { id: { in: byType("PATHWAY") } }, select: { id: true, title: true, type: true } })
      : Promise.resolve([]),
  ]);

  const collegeMap  = new Map(colleges.map((c) => [c.id, c]));
  const bursaryMap  = new Map(bursaries.map((b) => [b.id, b]));
  const pathwayMap  = new Map(pathways.map((p) => [p.id, p]));

  const enrichedReviews = reviews.map((r) => ({
    ...r,
    tvetCollege: r.entityId ? (collegeMap.get(r.entityId)  ?? null) : null,
    bursary:     r.entityId ? (bursaryMap.get(r.entityId)  ?? null) : null,
    pathway:     r.entityId ? (pathwayMap.get(r.entityId)  ?? null) : null,
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
  const ct = review.contentType as string;
  let tvetCollege = null, bursary = null, pathway = null;

  if (ct === "TVET_COLLEGE" && review.entityId) {
    tvetCollege = await prisma.tvetCollege.findUnique({
      where:  { id: review.entityId },
      select: { id: true, name: true, abbreviation: true, province: true, collegeType: true, website: true, sourceUrl: true, verifiedNote: true, logoUrl: true, status: true },
    });
  }
  if (ct === "BURSARY" && review.entityId) {
    bursary = await prisma.bursary.findUnique({
      where:  { id: review.entityId },
      select: { id: true, name: true, provider: true, description: true, amount: true, fieldsOfStudy: true, eligibilityCriteria: true, applicationUrl: true, openDate: true, closeDate: true, sourceUrl: true, status: true },
    });
  }
  if (ct === "PATHWAY" && review.entityId) {
    pathway = await prisma.pathway.findUnique({
      where:  { id: review.entityId },
      select: { id: true, title: true, type: true, durationLabel: true, estimatedCostMin: true, estimatedCostMax: true, costNote: true, earnWhileLearn: true, entryRequirements: true, apsMin: true, steps: true, fundingOptions: true, setaName: true, qualificationEarned: true, nqfLevelEarned: true, employmentNote: true, pros: true, cons: true, sourceUrl: true, status: true, career: { select: { title: true } } },
    });
  }

  return res.status(HttpStatus.OK).json({ status: "success", data: { ...review, tvetCollege, bursary, pathway } });
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

  // Move content to IN_REVIEW so it stays visible in the admin queue with updated status
  const ct = contentType as string;
  if (careerId)   await prisma.career.update({ where: { id: careerId }, data: { status: "IN_REVIEW" } }).catch(() => {});
  if (questionId) await prisma.assessmentQuestion.update({ where: { id: questionId }, data: { status: "IN_REVIEW" } }).catch(() => {});
  if (entityId) {
    if (ct === "PATHWAY")      await prisma.pathway.update({ where: { id: entityId }, data: { status: "IN_REVIEW" } }).catch(() => {});
    if (ct === "BURSARY")      await prisma.bursary.update({ where: { id: entityId }, data: { status: "IN_REVIEW" } }).catch(() => {});
    if (ct === "TVET_COLLEGE") await prisma.tvetCollege.update({ where: { id: entityId }, data: { status: "IN_REVIEW" } }).catch(() => {});
  }

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
        status:           "DRAFT",
        confidenceRating: confidenceRating ? parseInt(confidenceRating) : undefined,
        notes:            notes ?? undefined,
        trackedChanges:   trackedChanges ?? undefined,
      },
    });
    return res.status(HttpStatus.OK).json({ status: "success", data: saved });
  }

  // ── TAKE OFFLINE: revert a live/archived review back to in-progress ─────────
  if (decision === "TAKE_OFFLINE") {
    const reverted = await prisma.contentReview.update({
      where: { id },
      data: { status: "DRAFT", completedAt: null },
    });
    // Revert content status back to IN_REVIEW
    const offlineEntityId = (review as any).entityId as string | null | undefined;
    const offlineCt = review.contentType as string;
    if (review.careerId)   await prisma.career.update({ where: { id: review.careerId }, data: { status: "IN_REVIEW" } }).catch(() => {});
    if (review.questionId) await prisma.assessmentQuestion.update({ where: { id: review.questionId }, data: { status: "IN_REVIEW" } }).catch(() => {});
    if (offlineEntityId) {
      if (offlineCt === "BURSARY")      await prisma.bursary.update({ where: { id: offlineEntityId }, data: { status: "IN_REVIEW" } }).catch(() => {});
      if (offlineCt === "PATHWAY")      await prisma.pathway.update({ where: { id: offlineEntityId }, data: { status: "IN_REVIEW" } }).catch(() => {});
      if (offlineCt === "TVET_COLLEGE") await prisma.tvetCollege.update({ where: { id: offlineEntityId }, data: { status: "IN_REVIEW" } }).catch(() => {});
    }
    return res.status(HttpStatus.OK).json({ status: "success", data: reverted });
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
