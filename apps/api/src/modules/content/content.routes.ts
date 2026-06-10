import { Router } from "express";
import {
  listGenerationJobs, createGenerationJob, retryGenerationJob,
  listPromptTemplates, createPromptTemplate, updatePromptTemplate,
  listReviews, assignReview, assignReviewBulk, submitReview,
  listVerifications, assignVerification, submitVerification,
  listSources, createSource, updateSource,
} from "./content.controller.js";
import { protect }   from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role }      from "@repo/types";

const router = Router();
router.use(protect);

const contentManagers = [Role.SUPER_ADMIN, Role.ADMIN, Role.CONTENT_MANAGER];
const reviewerRoles   = [Role.SUPER_ADMIN, Role.ADMIN, Role.CONTENT_MANAGER, Role.REVIEWER];
const verifierRoles   = [Role.SUPER_ADMIN, Role.ADMIN, Role.CONTENT_MANAGER, Role.DATA_VERIFIER];
const allStaff        = [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.CONTENT_MANAGER, Role.REVIEWER, Role.DATA_VERIFIER];

// Generation jobs
router.get("/jobs",         authorize(contentManagers), listGenerationJobs);
router.post("/jobs",        authorize(contentManagers), createGenerationJob);
router.post("/jobs/:id/retry", authorize(contentManagers), retryGenerationJob);

// Prompt templates
router.get("/prompts",      authorize(contentManagers), listPromptTemplates);
router.post("/prompts",     authorize(contentManagers), createPromptTemplate);
router.patch("/prompts/:id", authorize(contentManagers), updatePromptTemplate);

// Reviews
router.get("/reviews",              authorize(reviewerRoles),   listReviews);
router.post("/reviews",             authorize(contentManagers), assignReview);
router.post("/reviews/bulk",        authorize(contentManagers), assignReviewBulk);
router.patch("/reviews/:id",        authorize(reviewerRoles),   submitReview);

// Verifications
router.get("/verifications",         authorize(verifierRoles),   listVerifications);
router.post("/verifications",        authorize(contentManagers), assignVerification);
router.patch("/verifications/:id",   authorize(verifierRoles),   submitVerification);

// Source library
router.get("/sources",      authorize(allStaff),        listSources);
router.post("/sources",     authorize(contentManagers), createSource);
router.patch("/sources/:id", authorize(contentManagers), updateSource);

export default router;
