"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle } from "lucide-react";
import Link from "next/link";
import apiClient from "@/api/client";

const T = {
  primary:   "#5B4FCF",
  secondary: "#EEE9FF",
  coral:     "#F97066",
  teal:      "#0D9488",
  amber:     "#D97706",
  bg:        "#FAFAF9",
  card:      "#FFFFFF",
  fg:        "#1A1535",
  muted:     "#7A7499",
  border:    "rgba(91,79,207,0.12)",
};

const ASSESSMENT_META: Record<string, { label: string; color: string; href: string }> = {
  INTEREST:    { label: "Interest",    color: T.teal,    href: "/learner/assessments/INTEREST" },
  APTITUDE:    { label: "Aptitude",    color: T.primary, href: "/learner/assessments/APTITUDE" },
  PERSONALITY: { label: "Personality", color: T.coral,   href: "/learner/assessments/PERSONALITY" },
  VALUES:      { label: "Values",      color: "#F59E0B", href: "/learner/assessments/VALUES" },
};

function CircleProgress({ pct, label, color, href }: { pct: number; label: string; color: string; href: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <Link href={href} style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={72} height={72}>
        <circle cx={36} cy={36} r={r} fill="none" stroke={T.border} strokeWidth={6} />
        <circle
          cx={36} cy={36} r={r} fill="none"
          stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
        <text x={36} y={40} textAnchor="middle" fontSize={13} fontWeight={700} fill={T.fg}>{pct}%</text>
      </svg>
      <span style={{ fontSize: 11, color: T.muted, textAlign: "center" }}>{label}</span>
    </Link>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function LearnerHomePage() {
  const [user,        setUser]        = useState<any>(null);
  const [profile,     setProfile]     = useState<any>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);

  const fetchDashboard = () =>
    Promise.all([
      apiClient.get("/users/me").then((r) => r.data.data.user).catch(() => null),
      apiClient.get("/learner/profile").then((r) => r.data.data).catch(() => null),
      apiClient.get("/assessments/me").then((r) => r.data.data).catch(() => []),
    ]).then(([u, p, a]) => {
      setUser(u);
      setProfile(p);
      setAssessments(Array.isArray(a) ? a : []);
    }).finally(() => setLoading(false));

  useEffect(() => {
    fetchDashboard();
    window.addEventListener("profile-updated", fetchDashboard);
    return () => window.removeEventListener("profile-updated", fetchDashboard);
  }, []);

  const today     = new Date().toLocaleDateString("en-ZA", { weekday: "long", month: "long", day: "numeric" });
  const firstName = user?.firstName ?? user?.displayName?.split(" ")[0] ?? "there";

  // Assessment completion map
  const assessMap: Record<string, any> = {};
  for (const a of assessments) assessMap[a.assessmentType] = a;

  const assessTypes   = ["INTEREST", "APTITUDE", "PERSONALITY", "VALUES"];
  const completedCount = assessTypes.filter((t) => assessMap[t]?.status === "COMPLETED").length;

  // Top career matches (top 3)
  const topMatches = (profile?.careerMatches ?? []).slice(0, 3);

  // Today's actions — derive from what's actually missing
  const actions: { label: string; href: string }[] = [];
  for (const type of assessTypes) {
    if (assessMap[type]?.status !== "COMPLETED" && actions.length < 3) {
      const meta = ASSESSMENT_META[type];
      const inProgress = assessMap[type]?.status === "IN_PROGRESS";
      actions.push({ label: `${inProgress ? "Continue" : "Start"} ${meta.label} Assessment`, href: meta.href });
    }
  }
  if (!profile?.chosenCareerId && actions.length < 3)
    actions.push({ label: "Set your career goal", href: "/learner/roadmap" });
  if (topMatches.length === 0 && actions.length < 3)
    actions.push({ label: "Explore career matches", href: "/learner/matches" });
  if (actions.length < 3)
    actions.push({ label: "Explore bursaries", href: "/learner/bursaries" });

  // Milestones — fixed list derived from real state
  const milestones = [
    { label: "Create your profile",           done: !!user?.firstName },
    { label: "Complete Interest Assessment",  done: assessMap["INTEREST"]?.status  === "COMPLETED" },
    { label: "Complete Aptitude Assessment",  done: assessMap["APTITUDE"]?.status  === "COMPLETED" },
    { label: "Complete Personality Assessment", done: assessMap["PERSONALITY"]?.status === "COMPLETED" },
    { label: "Complete Values Assessment",    done: assessMap["VALUES"]?.status    === "COMPLETED" },
    { label: "Explore your career matches",   done: (profile?.careerMatches?.length ?? 0) > 0 },
    { label: "Set your career goal",          done: !!profile?.chosenCareerId },
  ];

  // Recent activity derived from real timestamps
  const activity: { emoji: string; text: string; ts: Date }[] = [];
  for (const type of assessTypes) {
    const s = assessMap[type];
    if (s?.completedAt) activity.push({ emoji: "🎯", text: `Completed ${ASSESSMENT_META[type].label} Assessment`, ts: new Date(s.completedAt) });
    else if (s?.startedAt) activity.push({ emoji: "📝", text: `Started ${ASSESSMENT_META[type].label} Assessment`, ts: new Date(s.startedAt) });
  }
  if (profile?.generatedAt)
    activity.push({ emoji: "✨", text: "Career profile generated", ts: new Date(profile.generatedAt) });
  for (const sc of (profile?.savedCareers ?? []).slice(0, 2))
    activity.push({ emoji: "💼", text: `Saved ${sc.career?.title ?? "a career"}`, ts: new Date(sc.createdAt ?? 0) });

  activity.sort((a, b) => b.ts.getTime() - a.ts.getTime());

  function timeAgo(ts: Date) {
    const diff = Date.now() - ts.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60)  return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "Yesterday";
    if (days < 7)   return `${days} days ago`;
    return ts.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
  }

  if (loading) return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 14 }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${T.primary}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginRight: 12 }} />
      Loading your dashboard…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="home-wrap" style={{ background: T.bg, minHeight: "100vh", padding: "24px 24px 48px", fontFamily: "inherit" }}>

      {/* Top bar — date + greeting only, no bell/avatar */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ margin: 0, fontSize: 13, color: T.muted }}>{today}</p>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.fg }}>{greeting()}, {firstName} 👋</h1>
      </div>

      {/* 3-column top cards */}
      <div className="home-top-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Assessment Progress */}
        <div style={{ background: T.card, borderRadius: 16, padding: 20, border: `1px solid ${T.border}`, height: "100%", boxSizing: "border-box" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: T.fg }}>Assessment Progress</h3>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: T.muted }}>{completedCount} of 4 completed</p>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            {assessTypes.map((type) => {
              const meta = ASSESSMENT_META[type];
              const status = assessMap[type]?.status;
              const pct = status === "COMPLETED" ? 100 : status === "IN_PROGRESS" ? 50 : 0;
              return <CircleProgress key={type} pct={pct} label={meta.label} color={meta.color} href={meta.href} />;
            })}
          </div>
        </div>

        {/* Top Career Matches */}
        <Link href="/learner/matches" style={{ textDecoration: "none" }}>
          <div style={{ background: T.card, borderRadius: 16, padding: 20, border: `1px solid ${T.border}`, height: "100%", boxSizing: "border-box" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: T.fg }}>Top Career Matches</h3>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: T.muted }}>
              {topMatches.length > 0 ? "Based on your RIASEC profile" : "Complete the Interest Assessment to see matches"}
            </p>
            {topMatches.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {topMatches.map((m: any) => {
                  const pct = Math.round(m.matchPercentage);
                  const color = pct >= 85 ? T.teal : pct >= 70 ? T.primary : T.amber;
                  return (
                    <div key={m.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: T.fg, fontWeight: 500 }}>{m.career?.title}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color }}>{pct}%</span>
                      </div>
                      <div style={{ height: 5, background: T.secondary, borderRadius: 99 }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "12px 0", color: T.muted, fontSize: 13 }}>
                No matches yet — take the Interest Assessment first
              </div>
            )}
          </div>
        </Link>

        {/* Today's Actions */}
        <div style={{ background: `linear-gradient(135deg, ${T.primary} 0%, #7C6FE0 100%)`, borderRadius: 16, padding: 20, color: "#fff", height: "100%", boxSizing: "border-box" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>Today&apos;s Actions</h3>
          <p style={{ margin: "0 0 16px", fontSize: 12, opacity: 0.75 }}>
            {actions.length === 0 ? "You're all caught up!" : `${actions.length} task${actions.length > 1 ? "s" : ""} to keep you on track`}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {actions.slice(0, 3).map((a, i) => (
              <Link key={i} href={a.href} style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 12px", transition: "background 0.15s" }}>
                  <Circle size={16} color="rgba(255,255,255,0.6)" />
                  <span style={{ fontSize: 13, color: "#fff" }}>{a.label}</span>
                </div>
              </Link>
            ))}
            {actions.length === 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 12px" }}>
                <CheckCircle size={16} color="rgba(255,255,255,0.8)" />
                <span style={{ fontSize: 13 }}>All tasks complete 🎉</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2-column bottom */}
      <div className="home-bottom-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Recent Activity */}
        <div style={{ background: T.card, borderRadius: 16, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: T.fg }}>Recent Activity</h3>
          {activity.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {activity.slice(0, 5).map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{a.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, color: T.fg, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.text}</p>
                    <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{timeAgo(a.ts)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: T.muted }}>No activity yet — start an assessment to get going.</p>
          )}
        </div>

        {/* Milestones */}
        <div style={{ background: T.card, borderRadius: 16, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: T.fg }}>Your Journey</h3>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: T.muted }}>
            {milestones.filter((m) => m.done).length} of {milestones.length} milestones reached
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {milestones.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {m.done
                  ? <CheckCircle size={18} color={T.teal} />
                  : <Circle size={18} color={T.border} />}
                <span style={{ fontSize: 13, color: m.done ? T.muted : T.fg, textDecoration: m.done ? "line-through" : "none" }}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .home-top-grid { grid-template-columns: 1fr !important; }
          .home-bottom-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 400px) {
          .home-wrap { padding: 16px 16px 48px !important; }
        }
      `}</style>
    </div>
  );
}
