import { Router } from "express";
import {
  managerDashboard, myLearners, atRiskLearners, assignLearner, learnerReport,
} from "./manager.controller.js";
import { protect }   from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role }      from "@repo/types";

const router = Router();
const managerRoles = [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER];

router.use(protect);
router.use(authorize(managerRoles));

router.get("/dashboard",     managerDashboard);
router.get("/learners",      myLearners);
router.get("/at-risk",       atRiskLearners);
router.post("/learners/assign", assignLearner);
router.get("/reports/learners", learnerReport);

export default router;
