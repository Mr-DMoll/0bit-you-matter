export interface NavItem {
  href:  string;
  label: string;
  icon:  string;
}

export interface NavSection {
  title?: string;   // section header label — omit for no header
  items:  NavItem[];
}

export const NAV_CONFIG: Record<string, NavSection[]> = {

  // ── Super Admin ────────────────────────────────────────────────────────────
  SUPER_ADMIN: [
    {
      items: [
        { href: "/super-admin",        label: "Dashboard", icon: "LayoutDashboard" },
        { href: "/super-admin/admins", label: "Admins",    icon: "ShieldCheck"     },
      ],
    },
    {
      title: "Platform",
      items: [
        { href: "/super-admin/infrastructure", label: "Infrastructure", icon: "Server" },
        { href: "/super-admin/ai-pipeline",    label: "AI Pipeline",    icon: "Bot"    },
        { href: "/super-admin/feature-flags",  label: "Feature Flags",  icon: "Flag"   },
      ],
    },
    {
      title: "Security",
      items: [
        { href: "/super-admin/security", label: "Security", icon: "Lock"     },
        { href: "/super-admin/settings", label: "Settings", icon: "Settings" },
      ],
    },
  ],

  // ── Admin ─────────────────────────────────────────────────────────────────
  ADMIN: [
    {
      title: "Overview",
      items: [
        { href: "/admin",           label: "Dashboard", icon: "LayoutDashboard" },
        { href: "/admin/analytics", label: "Analytics", icon: "BarChart2"       },
        { href: "/admin/users",     label: "Users",     icon: "UsersRound"      },
      ],
    },
    {
      title: "Content",
      items: [
        { href: "/admin/careers",          label: "Careers Library",  icon: "Briefcase"     },
        { href: "/admin/universities",     label: "University DB",    icon: "Building2"     },
        { href: "/admin/assessments",      label: "Assessment Bank",  icon: "ClipboardList" },
        { href: "/admin/bursaries",        label: "Bursaries",        icon: "Coins"         },
        { href: "/admin/tvet",             label: "TVET Colleges",    icon: "GraduationCap" },
        { href: "/admin/private-colleges", label: "Private Colleges", icon: "School"        },
        { href: "/admin/pathways",         label: "Pathways Library", icon: "Route"         },
        { href: "/admin/update-planner",   label: "Update Planner",   icon: "CalendarClock" },
      ],
    },
    {
      title: "Operations",
      items: [
        { href: "/admin/ai-pipeline",  label: "AI Pipeline",  icon: "Bot"       },
        { href: "/admin/review-queue", label: "Review Queue", icon: "ListChecks" },
      ],
    },
    {
      title: "System",
      items: [
        { href: "/admin/platform", label: "Platform", icon: "Cpu"        },
        { href: "/admin/logs",     label: "Logs",     icon: "ScrollText" },
      ],
    },
  ],

  // ── Manager ───────────────────────────────────────────────────────────────
  MANAGER: [
    {
      items: [
        { href: "/manager", label: "Dashboard", icon: "LayoutDashboard" },
      ],
    },
    {
      title: "Learners",
      items: [
        { href: "/manager/learners",       label: "My Learners",   icon: "GraduationCap" },
        { href: "/manager/groups",         label: "Groups",        icon: "Users"         },
        { href: "/manager/at-risk",        label: "At Risk",       icon: "AlertTriangle" },
        { href: "/manager/group-session",  label: "Group Session", icon: "MonitorPlay"   },
      ],
    },
    {
      title: "Content & Tasks",
      items: [
        { href: "/manager/review-queue",         label: "Review Queue",        icon: "ListChecks" },
        { href: "/manager/generation-requests",  label: "Generation Requests", icon: "Zap"        },
        { href: "/manager/reports",              label: "Reports",             icon: "FileText"   },
      ],
    },
  ],

  // ── Content Manager ───────────────────────────────────────────────────────
  // Same admin pages as ADMIN but scoped to Dashboard + Content + Operations only.
  // No Analytics, Users, or System access.
  CONTENT_MANAGER: [
    {
      title: "Overview",
      items: [
        { href: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
      ],
    },
    {
      title: "Content",
      items: [
        { href: "/admin/careers",          label: "Careers Library",  icon: "Briefcase"     },
        { href: "/admin/universities",     label: "University DB",    icon: "Building2"     },
        { href: "/admin/assessments",      label: "Assessment Bank",  icon: "ClipboardList" },
        { href: "/admin/bursaries",        label: "Bursaries",        icon: "Coins"         },
        { href: "/admin/tvet",             label: "TVET Colleges",    icon: "GraduationCap" },
        { href: "/admin/private-colleges", label: "Private Colleges", icon: "School"        },
        { href: "/admin/pathways",         label: "Pathways Library", icon: "Route"         },
        { href: "/admin/update-planner",   label: "Update Planner",   icon: "CalendarClock" },
      ],
    },
    {
      title: "Operations",
      items: [
        { href: "/admin/ai-pipeline",  label: "AI Pipeline",  icon: "Bot"        },
        { href: "/admin/review-queue", label: "Review Queue", icon: "ListChecks" },
      ],
    },
  ],

  // ── Reviewer ──────────────────────────────────────────────────────────────
  REVIEWER: [
    {
      items: [
        { href: "/reviewer",               label: "Review Queue",     icon: "ClipboardList" },
        { href: "/reviewer/contributions", label: "My Contributions", icon: "Trophy"        },
        { href: "/reviewer/notifications", label: "Notifications",    icon: "Bell"          },
      ],
    },
  ],

  // ── Learner ───────────────────────────────────────────────────────────────
  LEARNER: [
    {
      title: "Discover",
      items: [
        { href: "/learner",             label: "Home",            icon: "Home"          },
        { href: "/learner/assessments", label: "Assessments",     icon: "ClipboardList" },
        { href: "/learner/matches",     label: "Career Matches",  icon: "Sparkles"      },
        { href: "/learner/profile",     label: "My Profile",      icon: "UserCircle"    },
        { href: "/learner/explore",     label: "Explore Careers", icon: "Compass"       },
      ],
    },
    {
      title: "Apply",
      items: [
        { href: "/learner/universities", label: "Universities", icon: "Building2" },
        { href: "/learner/bursaries",    label: "Bursaries",    icon: "Coins"     },
      ],
    },
    {
      title: "My Journey",
      items: [
        { href: "/learner/chat",       label: "Guidance Chat", icon: "MessageCircle" },
        { href: "/learner/roadmap",    label: "My Roadmap",    icon: "Map"           },
        { href: "/learner/milestones", label: "My Milestones", icon: "Target"        },
      ],
    },
  ],
};
