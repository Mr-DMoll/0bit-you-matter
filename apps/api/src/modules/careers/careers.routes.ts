import { Router } from "express";
import {
  listClusters, createCluster,
  listCareers, getCareer, createCareer, updateCareer, deleteCareer,
  coverageStats,
} from "./careers.controller.js";
import { protect }   from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role }      from "@repo/types";

const router = Router();

const staff = [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.CONTENT_MANAGER, Role.REVIEWER, Role.DATA_VERIFIER];
const editors = [Role.SUPER_ADMIN, Role.ADMIN, Role.CONTENT_MANAGER];

// Public — learners browse careers (no auth required for read)
router.get("/clusters",       listClusters);
router.get("/",               listCareers);
router.get("/:slug",          getCareer);

// Staff/editor routes
router.post("/clusters",      protect, authorize(editors),  createCluster);
router.post("/",              protect, authorize(editors),  createCareer);
router.patch("/:id",          protect, authorize(editors),  updateCareer);
router.delete("/:id",         protect, authorize(editors),  deleteCareer);
router.get("/stats/coverage", protect, authorize(staff),    coverageStats);

export default router;
