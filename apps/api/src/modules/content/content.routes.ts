import { Router } from "express";
import {
  listGenerationJobs, createGenerationJob, retryGenerationJob, retryAllFailedJobs, seedTestPathways,
  listPromptTemplates, createPromptTemplate, updatePromptTemplate,
  listReviews, getReview, assignReview, assignReviewBulk, submitReview,
  listSources, createSource, updateSource,
} from "./content.controller.js";
import { protect }   from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role }      from "@repo/types";

const router = Router();
router.use(protect);

const contentManagers = [Role.SUPER_ADMIN, Role.ADMIN, Role.CONTENT_MANAGER];
const reviewerRoles   = [Role.SUPER_ADMIN, Role.ADMIN, Role.CONTENT_MANAGER, Role.REVIEWER];
// DATA_VERIFIER removed — REVIEWER is now the single verification authority
const allStaff        = [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.CONTENT_MANAGER, Role.REVIEWER];

// Generation jobs
router.get("/jobs",                 authorize(contentManagers), listGenerationJobs);
router.post("/jobs",                authorize(contentManagers), createGenerationJob);
router.post("/jobs/:id/retry",      authorize(contentManagers), retryGenerationJob);
router.post("/jobs/retry-all",      authorize(contentManagers), retryAllFailedJobs);
router.post("/jobs/seed-pathways",  authorize(contentManagers), seedTestPathways);

// Prompt templates
router.get("/prompts",         authorize(contentManagers), listPromptTemplates);
router.post("/prompts",        authorize(contentManagers), createPromptTemplate);
router.patch("/prompts/:id",   authorize(contentManagers), updatePromptTemplate);

// Reviews — reviewers can list, submit (verify/discard)
router.get("/reviews",         authorize(reviewerRoles),   listReviews);
router.get("/reviews/:id",     authorize(reviewerRoles),   getReview);
router.post("/reviews",        authorize(contentManagers), assignReview);
router.post("/reviews/bulk",   authorize(contentManagers), assignReviewBulk);
router.patch("/reviews/:id",   authorize(reviewerRoles),   submitReview);

// Source library
router.get("/sources",         authorize(allStaff),        listSources);
router.post("/sources",        authorize(contentManagers), createSource);
router.patch("/sources/:id",   authorize(contentManagers), updateSource);

export default router;
