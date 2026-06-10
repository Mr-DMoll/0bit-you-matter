import { Router } from "express";
import {
  listQuestions, createQuestion, updateQuestion,
  myAssessments, getAssessmentQuestions,
  startAssessment, saveAnswer, completeAssessment,
} from "./assessments.controller.js";
import { protect }   from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role }      from "@repo/types";

const router = Router();
const editors = [Role.SUPER_ADMIN, Role.ADMIN, Role.CONTENT_MANAGER];
const staff   = [Role.SUPER_ADMIN, Role.ADMIN, Role.CONTENT_MANAGER, Role.REVIEWER];

// Question bank (staff only)
router.get("/questions",      protect, authorize(staff),   listQuestions);
router.post("/questions",     protect, authorize(editors), createQuestion);
router.patch("/questions/:id", protect, authorize(editors), updateQuestion);

// Learner session endpoints (all authenticated users)
router.get("/me",                       protect, myAssessments);
router.get("/:type/questions",          protect, getAssessmentQuestions);
router.post("/:type/start",             protect, startAssessment);
router.post("/:type/answer",            protect, saveAnswer);
router.post("/:type/complete",          protect, completeAssessment);

export default router;
