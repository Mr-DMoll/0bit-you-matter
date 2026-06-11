import { Router } from "express";
import {
  listColleges, getCollege, createCollege, updateCollege,
  listProgrammes, createProgramme, updateProgramme,
} from "./tvet.controller.js";
import { protect }   from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role }      from "@repo/types";

const router = Router();
const editors = [Role.SUPER_ADMIN, Role.ADMIN, Role.CONTENT_MANAGER, Role.REVIEWER];

// Public reads
router.get("/",                           listColleges);
router.get("/:id",                        getCollege);
router.get("/:collegeId/programmes",      listProgrammes);

// Editor writes
router.post("/",                          protect, authorize(editors), createCollege);
router.patch("/:id",                      protect, authorize(editors), updateCollege);
router.post("/:collegeId/programmes",     protect, authorize(editors), createProgramme);
router.patch("/programmes/:id",           protect, authorize(editors), updateProgramme);

export default router;
