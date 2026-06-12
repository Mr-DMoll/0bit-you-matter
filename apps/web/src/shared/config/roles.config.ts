/**
 * Single source of truth for role → home route mappings.
 *
 * Import this wherever you need to redirect after login or guard a route.
 * Never define this map inline in a component — that's how roles get missed.
 */
export const ROLE_HOME_ROUTES: Record<string, string> = {
  SUPER_ADMIN:     "/super-admin",
  ADMIN:           "/admin",
  MANAGER:         "/manager",
  CONTENT_MANAGER: "/admin",
  REVIEWER:        "/reviewer",
  LEARNER:         "/learner",
};

/** Redirect destination for a given role. Falls back to "/" only as a last resort. */
export function roleHomeRoute(role: string | undefined | null): string {
  if (!role) return "/";
  return ROLE_HOME_ROUTES[role] ?? "/";
}
