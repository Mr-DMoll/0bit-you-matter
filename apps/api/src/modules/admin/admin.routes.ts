import { Router } from "express";
import {
  adminDashboard,
  adminAnalytics,
  adminActivity,
  listStaff,
  listLearners,
  inviteStaffMember,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getReviewerProfile,
  updateReviewerProfile,
  // legacy
  inviteManager,
  listManagers,
} from "./admin.controller.js";
import { protect }   from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role }      from "@repo/types";

const ADMIN_ONLY       = authorize([Role.ADMIN, Role.SUPER_ADMIN]);
const ADMIN_OR_CONTENT = authorize([Role.ADMIN, Role.SUPER_ADMIN, Role.CONTENT_MANAGER]);

const router = Router();
router.use(protect);

// ── Dashboard & activity ───────────────────────────────────────────────────────
router.get("/dashboard", ADMIN_OR_CONTENT, adminDashboard);
router.get("/analytics", ADMIN_ONLY,       adminAnalytics);
router.get("/activity",  ADMIN_ONLY,       adminActivity);

// ── Staff (all invitable roles) ────────────────────────────────────────────────
router.get("/staff",         ADMIN_ONLY, listStaff);
router.post("/staff/invite", ADMIN_ONLY, inviteStaffMember);

// ── Learners ───────────────────────────────────────────────────────────────────
router.get("/learners", ADMIN_ONLY, listLearners);

// ── Per-user actions ───────────────────────────────────────────────────────────
router.patch("/users/:id/status",  ADMIN_ONLY, updateUserStatus);
router.patch("/users/:id/role",    ADMIN_ONLY, updateUserRole);
router.delete("/users/:id",        ADMIN_ONLY, deleteUser);

// ── Content routes (CONTENT_MANAGER has access via their own API modules) ──────
router.get("/reviewers/:id/profile",   ADMIN_OR_CONTENT, getReviewerProfile);
router.patch("/reviewers/:id/profile", ADMIN_OR_CONTENT, updateReviewerProfile);

// ── Legacy routes ───────────────────────────────────────────────────────────────
router.get("/users",            ADMIN_ONLY, listStaff);
router.post("/users/invite",    ADMIN_ONLY, inviteStaffMember);
router.get("/managers",         ADMIN_ONLY, listManagers);
router.post("/managers/invite", ADMIN_ONLY, inviteManager);

export default router;
