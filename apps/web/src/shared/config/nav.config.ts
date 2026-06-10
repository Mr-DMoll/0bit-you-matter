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
      items: [
        { href: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
      ],
    },
    {
      title: "People",
      items: [
        { href: "/admin/learners",       label: "Learners",       icon: "GraduationCap" },
        { href: "/admin/managers",       label: "Managers",       icon: "UsersRound"    },
        { href: "/admin/reviewers",      label: "Reviewers",      icon: "PenLine"       },
        { href: "/admin/data-verifiers", label: "Data Verifiers", icon: "BadgeCheck"    },
      ],
    },
    {
      title: "Content",
      items: [
        { href: "/admin/careers",      label: "Careers Library",  icon: "Briefcase"    },
        { href: "/admin/universities", label: "University DB",    icon: "Building2"    },
        { href: "/admin/assessments",  label: "Assessment Bank",  icon: "ClipboardList" },
        { href: "/admin/bursaries",    label: "Bursaries",        icon: "Coins"        },
        { href: "/admin/tvet",             label: "TVET Colleges",     icon: "GraduationCap" },
        { href: "/admin/private-colleges", label: "Private Colleges",  icon: "School"        },
        { href: "/admin/pathways",         label: "Pathways Library",  icon: "Route"         },
      ],
    },
    {
      title: "AI & Automation",
      items: [
        { href: "/admin/ai-pipeline",   label: "AI Pipeline",    icon: "Bot"      },
        { href: "/admin/agent-activity", label: "Agent Activity", icon: "Activity" },
      ],
    },
    {
      title: "Analytics",
      items: [
        { href: "/admin/learner-insights",  label: "Learner Insights",  icon: "BarChart2"  },
        { href: "/admin/content-analytics", label: "Content Analytics", icon: "TrendingUp" },
        { href: "/admin/platform-growth",   label: "Platform Growth",   icon: "LineChart"  },
      ],
    },
    {
      title: "Operations",
      items: [
        { href: "/admin/review-queue",   label: "Review Queue",   icon: "ListChecks"    },
        { href: "/admin/update-planner", label: "Update Planner", icon: "CalendarClock" },
        { href: "/admin/reports",        label: "Reports",        icon: "FileText"      },
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
  CONTENT_MANAGER: [
    {
      title: "Generate",
      items: [
        { href: "/content-manager",                  label: "Generate Content", icon: "Zap"         },
        { href: "/content-manager/generation-queue", label: "Generation Queue", icon: "ListOrdered" },
        { href: "/content-manager/prompt-templates", label: "Prompt Templates", icon: "FileCode"    },
      ],
    },
    {
      title: "Review",
      items: [
        { href: "/content-manager/assign-reviews",  label: "Assign Reviews", icon: "UserCheck"  },
        { href: "/content-manager/review-status",   label: "Review Status",  icon: "ListChecks" },
        { href: "/content-manager/feedback-loop",   label: "Feedback Loop",  icon: "RefreshCw"  },
      ],
    },
    {
      title: "Verification",
      items: [
        { href: "/content-manager/verification-queue", label: "Verification Queue", icon: "BadgeCheck" },
        { href: "/content-manager/source-library",     label: "Source Library",     icon: "BookMarked" },
      ],
    },
    {
      title: "Planning",
      items: [
        { href: "/content-manager/update-planner",      label: "Update Planner",     icon: "CalendarClock" },
        { href: "/content-manager/coverage-map",        label: "Coverage Map",       icon: "Map"           },
        { href: "/content-manager/quality-dashboard",   label: "Quality Dashboard",  icon: "Star"          },
        { href: "/content-manager/freshness-dashboard", label: "Freshness Dashboard",icon: "Leaf"          },
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

  // ── Data Verifier ─────────────────────────────────────────────────────────
  DATA_VERIFIER: [
    {
      title: "Queues",
      items: [
        { href: "/data-verifier",                label: "APS Queue",      icon: "ClipboardList"  },
        { href: "/data-verifier/deadline-queue", label: "Deadline Queue", icon: "CalendarClock"  },
        { href: "/data-verifier/bursary-queue",  label: "Bursary Queue",  icon: "Coins"          },
      ],
    },
    {
      items: [
        { href: "/data-verifier/source-library", label: "Source Library", icon: "BookMarked" },
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
