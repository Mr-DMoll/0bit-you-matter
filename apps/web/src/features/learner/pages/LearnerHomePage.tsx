"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, ChevronRight } from "lucide-react";
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
        <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 36 36)" />
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

// ── Grade-aware checklist builder ─────────────────────────────────────────────

interface Step {
  id:    string;
  label: string;
  desc:  string;
  href:  string;
  done:  boolean;
  cta:   string;
}

function buildChecklist(grade: number, assessMap: Record<string, any>, profile: any, user: any): Step[] {
  const interestDone    = assessMap["INTEREST"]?.status   === "COMPLETED";
  const hasSubjects     = Array.isArray(profile?.subjects) && profile.subjects.length > 0;
  const hasGoal         = !!profile?.chosenCareerId;
  const hasMatches      = (profile?.careerMatches?.length ?? 0) > 0;

  if (grade === 9) {
    return [
      {
        id:    "interest",
        label: "Discover your personality type",
        desc:  "Take the Interest Assessment to find out your RIASEC personality type.",
        href:  "/learner/assessments/INTEREST",
        done:  interestDone,
        cta:   interestDone ? "Done" : assessMap["INTEREST"]?.status === "IN_PROGRESS" ? "Continue" : "Start",
      },
      {
        id:    "stream",
        label: "See your recommended stream",
        desc:  "Find out if Science, Commerce, or Arts suits you best before choosing Grade 10 subjects.",
        href:  "/learner/roadmap",
        done:  interestDone,
        cta:   "View stream →",
      },
      {
        id:    "explore",
        label: "Explore careers in your stream",
        desc:  "Browse careers that match your personality type and spark your interest.",
        href:  "/learner/explore",
        done:  hasMatches,
        cta:   "Explore careers →",
      },
    ];
  }

  // Grade 10–12
  const steps: Step[] = [
    {
      id:    "interest",
      label: "Take the Interest Assessment",
      desc:  "Find your RIASEC personality type to unlock your personalised career matches.",
      href:  "/learner/assessments/INTEREST",
      done:  interestDone,
      cta:   interestDone ? "Done" : assessMap["INTEREST"]?.status === "IN_PROGRESS" ? "Continue" : "Start",
    },
    {
      id:    "subjects",
      label: "Add your school subjects",
      desc:  "Your subjects affect which careers suit you and help us calculate your APS score.",
      href:  "/learner/profile",
      done:  hasSubjects,
      cta:   hasSubjects ? "Done" : "Add subjects →",
    },
    {
      id:    "goal",
      label: "Set your career goal",
      desc:  "Choose a target career so your roadmap can show you the exact steps to get there.",
      href:  "/learner/roadmap",
      done:  hasGoal,
      cta:   hasGoal ? "Done" : "Set goal →",
    },
    {
      id:    "roadmap",
      label: "Follow your roadmap",
      desc:  "See the pathway to your career goal — entry requirements, APS, funding options.",
      href:  "/learner/roadmap",
      done:  hasGoal,
      cta:   "Open roadmap →",
    },
  ];

  // Grade 12 gets two extra urgent steps
  if (grade === 12) {
    steps.push(
      {
        id:    "deadlines",
        label: "Check application deadlines",
        desc:  "University applications typically open May–June and close Sept–Oct. Don't miss yours.",
        href:  "/learner/universities",
        done:  false,
        cta:   "View universities →",
      },
      {
        id:    "bursaries",
        label: "Apply for bursaries",
        desc:  "Many bursaries close before university applications. Apply now to secure funding.",
        href:  "/learner/bursaries",
        done:  false,
        cta:   "Browse bursaries →",
      },
    );
  }

  return steps;
}

// ── Component ─────────────────────────────────────────────────────────────────

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
  const grade     = parseInt(user?.grade ?? "0") || 0;

  const assessMap: Record<string, any> = {};
  for (const a of assessments) assessMap[a.assessmentType] = a;

  const assessTypes    = ["INTEREST", "APTITUDE", "PERSONALITY", "VALUES"];
  const completedCount = assessTypes.filter((t) => assessMap[t]?.status === "COMPLETED").length;
  const topMatches     = (profile?.careerMatches ?? []).slice(0, 3);

  // Grade-aware checklist
  const checklist  = grade > 0 ? buildChecklist(grade, assessMap, profile, user) : [];
  const doneCount  = checklist.filter((s) => s.done).length;
  const nextStep   = checklist.find((s) => !s.done);
  const allDone    = checklist.length > 0 && doneCount === checklist.length;

  // Recent activity
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

  if (loading) return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 14 }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${T.primary}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginRight: 12 }} />
      Loading your dashboard…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const gradeLabel = grade > 0 ? `Grade ${grade}` : null;

  return (
    <div className="home-wrap" style={{ background: T.bg, minHeight: "100vh", padding: "24px 24px 48px", fontFamily: "inherit" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ margin: 0, fontSize: 13, color: T.muted }}>{today}</p>
        <h1 style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 700, color: T.fg }}>{greeting()}, {firstName} 👋</h1>
        {gradeLabel && <p style={{ margin: "2px 0 0", fontSize: 13, color: T.muted }}>{gradeLabel} learner</p>}
      </div>

      {/* ── Grade-aware checklist banner (prominent, above everything) ── */}
      {checklist.length > 0 && (
        <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, marginBottom: 16, overflow: "hidden" }}>
          {/* Header */}
          <div style={{
            padding: "16px 20px",
            background: allDone ? T.teal + "10" : T.primary + "08",
            borderBottom: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.fg }}>
                {grade === 9 ? "Your Grade 9 career journey" : `Your Grade ${grade} career checklist`}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: T.muted }}>
                {allDone ? "You're all set! Keep exploring 🎉" : `${doneCount} of ${checklist.length} steps done`}
              </p>
            </div>
            {/* Mini progress bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 80, height: 6, background: T.secondary, borderRadius: 99 }}>
                <div style={{ width: `${(doneCount / checklist.length) * 100}%`, height: "100%", background: allDone ? T.teal : T.primary, borderRadius: 99, transition: "width 0.4s" }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: allDone ? T.teal : T.primary }}>
                {Math.round((doneCount / checklist.length) * 100)}%
              </span>
            </div>
          </div>

          {/* Steps */}
          <div style={{ padding: "12px 0" }}>
            {checklist.map((step, i) => {
              const isNext = step.id === nextStep?.id;
              return (
                <Link key={step.id} href={step.done && step.id !== "roadmap" && step.id !== "stream" && step.id !== "explore" && step.id !== "deadlines" && step.id !== "bursaries" ? "#" : step.href} style={{ textDecoration: "none" }}>
                  <div style={{
                    display: "flex", alignItems: "flex-start", gap: 14,
                    padding: "10px 20px",
                    background: isNext ? T.primary + "06" : "transparent",
                    borderLeft: isNext ? `3px solid ${T.primary}` : "3px solid transparent",
                    cursor: step.done && !["roadmap","stream","explore","deadlines","bursaries"].includes(step.id) ? "default" : "pointer",
                    transition: "background 0.12s",
                  }}>
                    {/* Icon */}
                    <div style={{ flexShrink: 0, marginTop: 2 }}>
                      {step.done
                        ? <CheckCircle size={20} color={T.teal} />
                        : <Circle size={20} color={isNext ? T.primary : T.border} />
                      }
                    </div>
                    {/* Text */}
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: isNext ? 700 : step.done ? 400 : 500, color: step.done ? T.muted : T.fg, textDecoration: step.done && !["roadmap","stream","explore"].includes(step.id) ? "line-through" : "none" }}>
                        {step.label}
                      </p>
                      {(isNext || !step.done) && (
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{step.desc}</p>
                      )}
                    </div>
                    {/* CTA */}
                    {!step.done || ["roadmap","stream","explore","deadlines","bursaries"].includes(step.id) ? (
                      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: isNext ? T.primary : T.muted, paddingTop: 2 }}>
                        {step.done ? step.cta : isNext ? <><span>{step.cta}</span><ChevronRight size={14} /></> : step.cta}
                      </div>
                    ) : null}
                  </div>
                  {i < checklist.length - 1 && <div style={{ height: 1, background: T.border, margin: "0 20px" }} />}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Top cards grid ── */}
      <div className="home-top-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Assessment Progress */}
        <div style={{ background: T.card, borderRadius: 16, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: T.fg }}>Assessment Progress</h3>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: T.muted }}>{completedCount} of 4 completed</p>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            {assessTypes.map((type) => {
              const meta   = ASSESSMENT_META[type];
              const status = assessMap[type]?.status;
              const pct    = status === "COMPLETED" ? 100 : status === "IN_PROGRESS" ? 50 : 0;
              return <CircleProgress key={type} pct={pct} label={meta.label} color={meta.color} href={meta.href} />;
            })}
          </div>
        </div>

        {/* Top Career Matches */}
        <Link href="/learner/matches" style={{ textDecoration: "none" }}>
          <div style={{ background: T.card, borderRadius: 16, padding: 20, border: `1px solid ${T.border}`, height: "100%", boxSizing: "border-box" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: T.fg }}>Top Career Matches</h3>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: T.muted }}>
              {topMatches.length > 0 ? "Based on your RIASEC profile" : "Complete Interest Assessment to see matches"}
            </p>
            {topMatches.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {topMatches.map((m: any) => {
                  const pct   = Math.round(m.matchPercentage);
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

        {/* Next action highlight */}
        <div style={{ background: `linear-gradient(135deg, ${T.primary} 0%, #7C6FE0 100%)`, borderRadius: 16, padding: 20, color: "#fff" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>
            {allDone ? "You're all caught up! 🎉" : "Your next step"}
          </h3>
          {nextStep ? (
            <>
              <p style={{ margin: "0 0 16px", fontSize: 12, opacity: 0.75 }}>{nextStep.desc}</p>
              <Link href={nextStep.href} style={{ textDecoration: "none" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.18)", borderRadius: 10, padding: "10px 16px" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{nextStep.cta}</span>
                  <ChevronRight size={16} color="#fff" />
                </div>
              </Link>
            </>
          ) : (
            <>
              <p style={{ margin: "0 0 16px", fontSize: 12, opacity: 0.75 }}>
                {grade === 9
                  ? "Your journey is set up — explore careers and choose your stream."
                  : "Your roadmap is ready. Explore bursaries and university options next."}
              </p>
              <Link href="/learner/bursaries" style={{ textDecoration: "none" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.18)", borderRadius: 10, padding: "10px 16px" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Browse bursaries →</span>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom grid ── */}
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

        {/* Saved careers quick-access */}
        <div style={{ background: T.card, borderRadius: 16, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: T.fg }}>Saved Careers</h3>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: T.muted }}>Careers you&apos;ve bookmarked</p>
          {(profile?.savedCareers ?? []).length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(profile.savedCareers as any[]).slice(0, 4).map((sc: any) => (
                <Link key={sc.careerId} href={`/learner/careers/${sc.career?.slug}`} style={{ textDecoration: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: T.secondary }}>
                    <span style={{ fontSize: 14, color: T.coral }}>♥</span>
                    <span style={{ fontSize: 13, color: T.fg, fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {sc.career?.title}
                    </span>
                    <ChevronRight size={14} color={T.muted} />
                  </div>
                </Link>
              ))}
              {(profile.savedCareers as any[]).length > 4 && (
                <Link href="/learner/matches" style={{ textDecoration: "none" }}>
                  <p style={{ margin: 0, fontSize: 12, color: T.primary, fontWeight: 600, paddingLeft: 4 }}>
                    +{(profile.savedCareers as any[]).length - 4} more →
                  </p>
                </Link>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <p style={{ fontSize: 13, color: T.muted, margin: "0 0 10px" }}>
                No saved careers yet. Explore careers and save the ones that interest you.
              </p>
              <Link href="/learner/explore" style={{ textDecoration: "none" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.primary }}>Explore careers →</span>
              </Link>
            </div>
          )}
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
