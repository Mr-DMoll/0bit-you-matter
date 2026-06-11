"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/shared/context/AuthContext";
import {
  Home, ClipboardList, Compass, Map, GraduationCap,
  Award, MessageCircle, User, Sparkles, LogOut,
} from "lucide-react";

// ── Learner theme tokens ───────────────────────────────────────────────────
const T = {
  primary:   "#5B4FCF",
  secondary: "#EEE9FF",
  coral:     "#F97066",
  sidebar:   "#1E1875",
  bg:        "#FAFAF9",
  card:      "#FFFFFF",
  fg:        "#1A1535",
  muted:     "#7A7499",
  border:    "rgba(91,79,207,0.12)",
};

const sidebarNav = [
  { href: "/learner",              label: "Home",         icon: Home },
  { href: "/learner/assessments",  label: "Assessments",  icon: ClipboardList },
  { href: "/learner/explore",      label: "Explore Careers", icon: Compass },
  { href: "/learner/roadmap",      label: "My Roadmap",   icon: Map },
  { href: "/learner/universities", label: "Universities", icon: GraduationCap },
  { href: "/learner/bursaries",    label: "Bursaries",    icon: Award },
  { href: "/learner/chat",         label: "Career Guide", icon: MessageCircle },
  { href: "/learner/profile",      label: "Profile",      icon: User },
];

const bottomNav = [
  { href: "/learner",             label: "Home",     icon: Home },
  { href: "/learner/explore",     label: "Explore",  icon: Compass },
  { href: "/learner/assessments", label: "Assess",   icon: ClipboardList },
  { href: "/learner/bursaries",   label: "Bursaries",icon: Award },
  { href: "/learner/profile",     label: "Me",       icon: User },
];

export function LearnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth() as any;

  const firstName = user?.firstName ?? user?.displayName?.split(" ")[0] ?? "there";
  const initial   = firstName[0]?.toUpperCase() ?? "U";

  const isActive = (href: string) =>
    href === "/learner" ? pathname === "/learner" : pathname.startsWith(href);

  return (
    <div style={{ display: "flex", minHeight: "100svh", background: T.bg }}>

      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="ym-sidebar" style={{
        width: 240, flexShrink: 0, background: T.sidebar,
        display: "flex", flexDirection: "column", minHeight: "100svh",
        position: "sticky", top: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: T.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={18} color="white" />
            </div>
            <div>
              <p style={{ color: "white", fontWeight: 800, fontSize: "1rem", lineHeight: 1.2 }}>You Matter</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.68rem" }}>Career Guidance</p>
            </div>
          </div>
        </div>

        {/* Greeting */}
        <div style={{ padding: "16px 24px 4px" }}>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.82rem", fontWeight: 600 }}>Hi, {firstName} 👋</p>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {sidebarNav.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 14px", borderRadius: 12,
                  background: active ? "rgba(255,255,255,0.15)" : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.52)",
                  fontWeight: active ? 600 : 400, fontSize: "0.88rem",
                  transition: "background 0.15s",
                }}>
                  <Icon size={17} style={{ opacity: active ? 1 : 0.65 }} />
                  {label}
                  {active && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "white", opacity: 0.7 }} />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Profile completion */}
        <div style={{ padding: "0 14px 16px" }}>
          <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px" }}>
            <p style={{ color: "rgba(255,255,255,0.85)", fontWeight: 700, fontSize: "0.8rem", marginBottom: 4 }}>Complete your profile</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", marginBottom: 10, lineHeight: 1.4 }}>Add your grade to unlock career matches</p>
            <div style={{ width: "100%", height: 5, borderRadius: 999, background: "rgba(255,255,255,0.12)" }}>
              <div style={{ width: "40%", height: "100%", borderRadius: 999, background: T.primary }} />
            </div>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem", marginTop: 5 }}>40% complete</p>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={() => logout?.()}
          style={{
            margin: "0 14px 20px", padding: "10px 14px", background: "transparent",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 10,
            color: "rgba(255,255,255,0.4)", fontSize: "0.82rem",
          }}
        >
          <LogOut size={15} /> Sign out
        </button>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="ym-main" style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
        {children}
      </main>

      {/* ── Mobile bottom nav ───────────────────────────────────────────── */}
      <nav className="ym-bottomnav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: T.card, borderTop: `1px solid ${T.border}`,
        display: "flex", paddingBottom: "max(8px, env(safe-area-inset-bottom))",
      }}>
        {bottomNav.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} style={{ flex: 1, textDecoration: "none" }}>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 3, padding: "10px 0",
                color: active ? T.primary : T.muted,
              }}>
                <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
                <span style={{ fontSize: "0.6rem", fontWeight: active ? 700 : 400 }}>{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <style>{`
        @media (min-width: 1024px) {
          .ym-bottomnav { display: none !important; }
          .ym-main { padding-bottom: 0 !important; }
        }
        @media (max-width: 1023px) {
          .ym-sidebar { display: none !important; }
          .ym-main { padding-bottom: 72px; }
        }
      `}</style>
    </div>
  );
}
