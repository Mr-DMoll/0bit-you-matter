"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/shared/context/AuthContext";
import { useState, useEffect } from "react";
import apiClient from "@/api/client";
import {
  Home, ClipboardList, Compass, Map, GraduationCap,
  Award, MessageCircle, User, LogOut, MoreHorizontal, X,
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
  { href: "/learner",             label: "Home",    icon: Home },
  { href: "/learner/explore",     label: "Explore", icon: Compass },
  { href: "/learner/assessments", label: "Assess",  icon: ClipboardList },
  { href: "/learner/profile",     label: "Me",      icon: User },
];

const moreNav = [
  { href: "/learner/roadmap",      label: "My Roadmap",   icon: Map },
  { href: "/learner/universities", label: "Universities", icon: GraduationCap },
  { href: "/learner/bursaries",    label: "Bursaries",    icon: Award },
  { href: "/learner/chat",         label: "Career Guide", icon: MessageCircle },
];

function calcCompletion(user: any, profile: any): { pct: number; missing: string[] } {
  const checks: [boolean, string][] = [
    [!!user?.firstName,                                                "First name"],
    [!!user?.grade,                                                    "Grade"],
    [!!user?.province,                                                 "Province"],
    [!!user?.school,                                                   "School"],
    [Array.isArray(profile?.subjects) && profile.subjects.length > 0, "Subjects"],
    [!!profile?.chosenCareerId || (profile?.careerMatches?.length > 0), "Career interest"],
  ];
  const done    = checks.filter(([ok]) => ok).length;
  const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
  return { pct: Math.round((done / checks.length) * 100), missing };
}

export function LearnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth() as any;

  const [sidebarUser,    setSidebarUser]    = useState<any>(null);
  const [profile,        setProfile]        = useState<any>(null);
  const [moreOpen,       setMoreOpen]       = useState(false);

  const fetchSidebarData = () =>
    Promise.all([
      apiClient.get("/users/me").then((r) => r.data.data.user).catch(() => null),
      apiClient.get("/learner/profile").then((r) => r.data.data).catch(() => null),
    ]).then(([u, p]) => { setSidebarUser(u); setProfile(p); });

  useEffect(() => { fetchSidebarData(); setMoreOpen(false); }, [pathname]);

  useEffect(() => {
    window.addEventListener("profile-updated", fetchSidebarData);
    return () => window.removeEventListener("profile-updated", fetchSidebarData);
  }, []);

  const firstName = user?.firstName ?? user?.displayName?.split(" ")[0] ?? "there";
  const initial   = firstName[0]?.toUpperCase() ?? "U";

  // Avatar for logo spot
  const avatarSrc      = sidebarUser?.avatarUrl ?? user?.avatarUrl;
  const avatarInitials = firstName[0]?.toUpperCase() ?? "?";

  // Use fresh fetched user (sidebarUser) — auth context user may lack grade/province/school
  const { pct, missing } = calcCompletion(sidebarUser ?? user, profile);
  const isDone = pct === 100;
  // Show the first 2 missing items as the hint, or a done message
  const hint = isDone
    ? "Your profile is complete 🎉"
    : missing.slice(0, 2).join(" & ") + (missing.length > 2 ? ` +${missing.length - 2} more` : "") + " still needed";

  const isActive = (href: string) =>
    href === "/learner" ? pathname === "/learner" : pathname.startsWith(href);

  return (
    <div style={{ display: "flex", height: "100svh", overflow: "hidden", background: T.bg }}>

      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="ym-sidebar" style={{
        width: 240, flexShrink: 0, background: T.sidebar,
        display: "flex", flexDirection: "column",
        height: "100svh", overflow: "hidden",
        position: "sticky", top: 0,
      }}>
        {/* Logo — learner avatar as the brand mark */}
        <Link href="/learner" style={{ textDecoration: "none" }}>
          <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Avatar circle — YOUR face IS the logo */}
              <div style={{
                width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                border: "2px solid rgba(255,255,255,0.3)", overflow: "hidden",
                background: avatarSrc ? "transparent" : `linear-gradient(135deg, ${T.primary}, #7C3AED)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {avatarSrc
                  ? <img src={avatarSrc} alt="You" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
                  : <span style={{ color: "#fff", fontSize: 15, fontWeight: 800 }}>{avatarInitials}</span>
                }
              </div>
              <div>
                <p style={{ color: "white", fontWeight: 800, fontSize: "1rem", lineHeight: 1.2, margin: 0 }}>You Matter</p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.68rem", margin: 0 }}>Career Guidance</p>
              </div>
            </div>
          </div>
        </Link>

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
        <Link href="/learner/profile" style={{ padding: "0 14px 16px", display: "block", textDecoration: "none" }}>
          <div style={{
            background: isDone ? "rgba(13,148,136,0.18)" : "rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "14px",
            border: isDone ? "1px solid rgba(13,148,136,0.35)" : "none",
            transition: "background 0.2s",
          }}>
            <p style={{ color: "rgba(255,255,255,0.85)", fontWeight: 700, fontSize: "0.8rem", marginBottom: 4 }}>
              {isDone ? "Profile complete ✓" : "Complete your profile"}
            </p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.7rem", marginBottom: 10, lineHeight: 1.4 }}>
              {hint}
            </p>
            <div style={{ width: "100%", height: 5, borderRadius: 999, background: "rgba(255,255,255,0.12)" }}>
              <div style={{
                width: `${pct}%`, height: "100%", borderRadius: 999,
                background: isDone ? "#0D9488" : T.primary,
                transition: "width 0.4s ease",
              }} />
            </div>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem", marginTop: 5 }}>{pct}% complete</p>
          </div>
        </Link>

        {/* Sign out */}
        <button
          onClick={async () => {
            await logout?.();
            window.location.href = "/login";
          }}
          style={{
            margin: "0 14px 20px", padding: "12px 14px", background: "transparent",
            border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 10, width: "calc(100% - 28px)",
            color: "rgba(255,255,255,0.5)", fontSize: "0.85rem",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.07)";
            e.currentTarget.style.color = "rgba(255,255,255,0.8)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255,255,255,0.5)";
          }}
        >
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="ym-main" style={{ flex: 1, overflowY: "auto", minWidth: 0, height: "100svh" }}>
        {children}
      </main>

      {/* ── Mobile bottom nav ───────────────────────────────────────────── */}
      <nav className="ym-bottomnav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: T.card, borderTop: `1px solid ${T.border}`,
        display: "flex",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
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
        {/* More button */}
        <button
          onClick={() => setMoreOpen(o => !o)}
          style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 3, padding: "10px 0",
            color: moreOpen ? T.primary : T.muted,
          }}>
            {moreOpen ? <X size={21} strokeWidth={2.5} /> : <MoreHorizontal size={21} strokeWidth={1.8} />}
            <span style={{ fontSize: "0.6rem", fontWeight: moreOpen ? 700 : 400 }}>More</span>
          </div>
        </button>
      </nav>

      {/* ── More sheet ──────────────────────────────────────────────────── */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMoreOpen(false)}
            className="ym-more-backdrop"
            style={{ position: "fixed", inset: 0, zIndex: 48, background: "rgba(0,0,0,0.35)" }}
          />
          {/* Sheet */}
          <div className="ym-more-sheet" style={{
            position: "fixed", left: 0, right: 0, zIndex: 49,
            bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
            background: T.card,
            borderTop: `1px solid ${T.border}`,
            borderRadius: "20px 20px 0 0",
            padding: "16px 16px 8px",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
          }}>
            <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>More</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {moreNav.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link key={href} href={href} style={{ textDecoration: "none" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px", borderRadius: 14,
                      background: active ? T.secondary : "#F5F4FC",
                      color: active ? T.primary : T.fg,
                      fontWeight: active ? 700 : 500, fontSize: 14,
                    }}>
                      <Icon size={18} color={active ? T.primary : T.muted} strokeWidth={active ? 2.5 : 1.8} />
                      {label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      <style>{`
        @media (min-width: 1024px) {
          .ym-bottomnav { display: none !important; }
          .ym-more-backdrop { display: none !important; }
          .ym-more-sheet { display: none !important; }
          .ym-main { padding-bottom: 0 !important; }
        }
        @media (max-width: 1023px) {
          .ym-sidebar { display: none !important; }
          .ym-main { padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px)); }
        }
        @media (max-width: 400px) {
          .ym-main { font-size: 14px; }
        }
      `}</style>
    </div>
  );
}
