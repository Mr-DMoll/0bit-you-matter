"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/shared/context/AuthContext";
import {
  Home, ClipboardList, Compass, UserCircle, MessageCircle,
  Map, Target, Building2, Coins, LogOut, Menu, X, ChevronRight,
} from "lucide-react";
import { useState } from "react";

const BOTTOM_NAV = [
  { href: "/learner",             icon: Home,          label: "Home"       },
  { href: "/learner/assessments", icon: ClipboardList, label: "Assess"     },
  { href: "/learner/explore",     icon: Compass,       label: "Explore"    },
  { href: "/learner/chat",        icon: MessageCircle, label: "Chat"       },
  { href: "/learner/profile",     icon: UserCircle,    label: "Me"         },
];

const DRAWER_NAV = [
  { section: "Discover", items: [
    { href: "/learner",             icon: Home,          label: "Home"            },
    { href: "/learner/assessments", icon: ClipboardList, label: "Assessments"     },
    { href: "/learner/explore",     icon: Compass,       label: "Explore Careers" },
  ]},
  { section: "Plan", items: [
    { href: "/learner/universities", icon: Building2,    label: "Universities"    },
    { href: "/learner/bursaries",    icon: Coins,        label: "Bursaries"       },
    { href: "/learner/roadmap",      icon: Map,          label: "My Roadmap"      },
    { href: "/learner/milestones",   icon: Target,       label: "Milestones"      },
  ]},
  { section: "Me", items: [
    { href: "/learner/profile",      icon: UserCircle,   label: "My Profile"      },
    { href: "/learner/chat",         icon: MessageCircle,label: "Guidance Chat"   },
  ]},
];

export function LearnerShell({ children }: { children: React.ReactNode }) {
  const pathname        = usePathname();
  const { user, logout } = useAuth() as any;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const firstName = user?.firstName ?? user?.displayName?.split(" ")[0] ?? "there";

  return (
    <div style={{
      minHeight:  "100svh",
      background: "var(--color-bg)",
      display:    "flex",
      flexDirection: "column",
    }}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header style={{
        position:       "sticky",
        top:            0,
        zIndex:         40,
        background:     "var(--color-bg-secondary)",
        borderBottom:   "1px solid var(--color-border)",
        height:         "56px",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        padding:        "0 16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "var(--color-text-secondary)", display: "flex" }}
          >
            <Menu size={22} />
          </button>
          <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-accent)" }}>
            You Matter
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            background: "var(--color-accent)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: 700,
          }}>
            {firstName[0].toUpperCase()}
          </div>
        </div>
      </header>

      {/* ── Drawer overlay ───────────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50 }}
        />
      )}

      {/* ── Drawer ───────────────────────────────────────────────────────── */}
      <div style={{
        position:   "fixed",
        top:        0,
        left:       0,
        bottom:     0,
        width:      "272px",
        background: "var(--color-bg-secondary)",
        borderRight:"1px solid var(--color-border)",
        zIndex:     60,
        transform:  drawerOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease",
        display:    "flex",
        flexDirection: "column",
        overflowY:  "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
          <div>
            <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-accent)" }}>You Matter</p>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>Hi, {firstName} 👋</p>
          </div>
          <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}>
            <X size={20} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: "12px 0" }}>
          {DRAWER_NAV.map(({ section, items }) => (
            <div key={section}>
              <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "8px 20px 4px" }}>{section}</p>
              {items.map(({ href, icon: Icon, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href} href={href}
                    onClick={() => setDrawerOpen(false)}
                    style={{
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: "space-between",
                      padding:        "10px 20px",
                      textDecoration: "none",
                      background:     active ? "var(--color-accent-subtle)" : "transparent",
                      borderLeft:     active ? `3px solid var(--color-accent)` : "3px solid transparent",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <Icon size={18} strokeWidth={active ? 2.5 : 1.8}
                        color={active ? "var(--color-accent)" : "var(--color-text-secondary)"} />
                      <span style={{ fontSize: "14px", fontWeight: active ? 600 : 400, color: active ? "var(--color-accent)" : "var(--color-text-secondary)" }}>
                        {label}
                      </span>
                    </div>
                    {active && <ChevronRight size={14} color="var(--color-accent)" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--color-border)" }}>
          <button
            onClick={() => { logout?.(); setDrawerOpen(false); }}
            style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "14px", padding: 0 }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>

      {/* ── Page content ─────────────────────────────────────────────────── */}
      <main style={{
        flex:           1,
        padding:        "20px 16px 88px",  /* bottom padding for the nav bar */
        maxWidth:       "600px",            /* phone-width column on desktop */
        width:          "100%",
        margin:         "0 auto",
        boxSizing:      "border-box",
      }}>
        {children}
      </main>

      {/* ── Bottom nav ───────────────────────────────────────────────────── */}
      <nav style={{
        position:       "fixed",
        bottom:         0,
        left:           0,
        right:          0,
        height:         "64px",
        background:     "var(--color-bg-secondary)",
        borderTop:      "1px solid var(--color-border)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-around",
        zIndex:         40,
        paddingBottom:  "env(safe-area-inset-bottom, 0px)",
      }}>
        {BOTTOM_NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/learner" && pathname.startsWith(href));
          return (
            <Link
              key={href} href={href}
              style={{
                display:        "flex",
                flexDirection:  "column",
                alignItems:     "center",
                gap:            "3px",
                textDecoration: "none",
                flex:           1,
                padding:        "6px 0",
              }}
            >
              <div style={{
                width:        "40px",
                height:       "26px",
                borderRadius: "13px",
                background:   active ? "var(--color-accent-subtle)" : "transparent",
                display:      "flex",
                alignItems:   "center",
                justifyContent: "center",
                transition:   "background 0.15s",
              }}>
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  color={active ? "var(--color-accent)" : "var(--color-text-muted)"}
                />
              </div>
              <span style={{
                fontSize:   "10px",
                fontWeight: active ? 600 : 400,
                color:      active ? "var(--color-accent)" : "var(--color-text-muted)",
              }}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
