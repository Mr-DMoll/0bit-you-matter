import { Router } from "express";
import { listPathways, getPathway, createPathway, updatePathway, getCareerPathways } from "./pathways.controller.js";
import { protect }   from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role }      from "@repo/types";

const router = Router();
const editors = [Role.SUPER_ADMIN, Role.ADMIN, Role.CONTENT_MANAGER, Role.REVIEWER];

// Public / learner reads
router.get("/",                       listPathways);
router.get("/career/:careerId",       getCareerPathways);
router.get("/:id",                    getPathway);

// Editor writes
router.post("/",                      protect, authorize(editors), createPathway);
router.patch("/:id",                  protect, authorize(editors), updatePathway);

export default router;
