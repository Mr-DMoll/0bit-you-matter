/**
 * PERMISSIONS
 * You Matter — career guidance platform
 */
export const PERMISSIONS = {
  // ── Super Admin ──────────────────────────────────────────────────────────
  ADD_ADMIN:               "add_admin",
  MANAGE_PLATFORM:         "manage_platform",
  MANAGE_AI_CONFIG:        "manage_ai_config",
  MANAGE_FEATURE_FLAGS:    "manage_feature_flags",
  VIEW_AUDIT_LOGS:         "view_audit_logs",

  // ── Admin ────────────────────────────────────────────────────────────────
  MANAGE_ALL_USERS:        "manage_all_users",
  INVITE_USERS:            "invite_users",
  VIEW_PLATFORM_ANALYTICS: "view_platform_analytics",
  MANAGE_CONTENT_PIPELINE: "manage_content_pipeline",

  // ── Manager ──────────────────────────────────────────────────────────────
  MANAGE_LEARNERS:         "manage_learners",
  VIEW_COHORT_REPORTS:     "view_cohort_reports",
  REQUEST_GENERATION:      "request_generation",

  // ── Content Manager ──────────────────────────────────────────────────────
  TRIGGER_AI_GENERATION:   "trigger_ai_generation",
  MANAGE_PROMPTS:          "manage_prompts",
  ASSIGN_REVIEWS:          "assign_reviews",
  MANAGE_SOURCES:          "manage_sources",

  // ── Reviewer ─────────────────────────────────────────────────────────────
  REVIEW_CONTENT:          "review_content",
  APPROVE_CONTENT:         "approve_content",
  REJECT_CONTENT:          "reject_content",

  // ── Data Verifier ────────────────────────────────────────────────────────
  VERIFY_APS_DATA:         "verify_aps_data",
  VERIFY_DEADLINES:        "verify_deadlines",
  VERIFY_BURSARIES:        "verify_bursaries",

  // ── Learner ──────────────────────────────────────────────────────────────
  TAKE_ASSESSMENTS:        "take_assessments",
  VIEW_CAREER_LIBRARY:     "view_career_library",
  USE_GUIDANCE_CHAT:       "use_guidance_chat",
  VIEW_OWN_PROFILE:        "view_own_profile",
} as const;

export type PermissionType = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
