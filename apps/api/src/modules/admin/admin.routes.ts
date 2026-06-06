import { Router } from "express";
import {
  adminDashboard,
  adminActivity,
  listStaff,
  listLearners,
  inviteStaffMember,
  updateUserStatus,
  updateUserRole,
  // legacy
  inviteManager,
  listManagers,
} from "./admin.controller.js";
import { protect }   from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role }      from "@repo/types";

const router = Router();
router.use(protect);
router.use(authorize([Role.ADMIN, Role.SUPER_ADMIN]));

// ── Dashboard & activity ───────────────────────────────────────────────────────
router.get("/dashboard", adminDashboard);
router.get("/activity",  adminActivity);

// ── Staff (all invitable roles) ────────────────────────────────────────────────
// GET  /admin/staff?role=MANAGER|CONTENT_MANAGER|REVIEWER|DATA_VERIFIER&status=ACTIVE
// POST /admin/staff/invite  { email, firstName, lastName, role }
router.get("/staff",         listStaff);
router.post("/staff/invite", inviteStaffMember);

// ── Learners ───────────────────────────────────────────────────────────────────
router.get("/learners", listLearners);

// ── Per-user actions ───────────────────────────────────────────────────────────
router.patch("/users/:id/status", updateUserStatus);
router.patch("/users/:id/role",   updateUserRole);

// ── Legacy routes (kept for backwards compat) ──────────────────────────────────
router.get("/users",            listStaff);
router.post("/users/invite",    inviteStaffMember);
router.get("/managers",         listManagers);
router.post("/managers/invite", inviteManager);

export default router;
