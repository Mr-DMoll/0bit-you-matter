import { Router } from "express";
import {
  listUniversities, getUniversity, createUniversity, updateUniversity,
  listProgrammes, createProgramme, updateProgramme,
  apsCheck,
} from "./universities.controller.js";
import { protect }   from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role }      from "@repo/types";

const router = Router();
const editors = [Role.SUPER_ADMIN, Role.ADMIN, Role.CONTENT_MANAGER, Role.REVIEWER];

// Public reads
router.get("/",                          listUniversities);
router.get("/:id",                       getUniversity);
router.get("/:universityId/programmes",  listProgrammes);
router.post("/aps-check",                apsCheck);

// Editor writes
router.post("/",                                   protect, authorize(editors), createUniversity);
router.patch("/:id",                               protect, authorize(editors), updateUniversity);
router.post("/:universityId/programmes",           protect, authorize(editors), createProgramme);
router.patch("/programmes/:id",                    protect, authorize(editors), updateProgramme);

export default router;
