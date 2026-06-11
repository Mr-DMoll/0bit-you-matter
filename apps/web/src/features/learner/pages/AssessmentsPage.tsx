"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/client";

const T = {
  primary:   "#5B4FCF",
  secondary: "#EEE9FF",
  coral:     "#F97066",
  teal:      "#0D9488",
  bg:        "#FAFAF9",
  card:      "#FFFFFF",
  fg:        "#1A1535",
  muted:     "#7A7499",
  border:    "rgba(91,79,207,0.12)",
};

// Question counts must match QUESTIONS_PER_TYPE in the API
const QUESTION_COUNTS: Record<string, number> = {
  INTEREST:    20,
  PERSONALITY: 20,
  APTITUDE:    15,
  VALUES:      15,
};

const ASSESSMENT_META: Record<string, { icon: string; name: string; desc: string; time: string; color: string }> = {
  INTEREST:    { icon: "🎯", name: "Interest",    desc: "Discover what activities, subjects and environments energise you most.",  time: "~8 min",  color: "#5B4FCF" },
  APTITUDE:    { icon: "🧠", name: "Aptitude",    desc: "Measure your strengths in reasoning, numeracy and problem-solving.",      time: "~10 min", color: "#0D9488" },
  PERSONALITY: { icon: "✨", name: "Personality", desc: "Understand how you interact with the world and what drives you.",         time: "~8 min",  color: "#D97706" },
  VALUES:      { icon: "💡", name: "Values",      desc: "Identify the core values that should shape your career path.",            time: "~6 min",  color: "#7C3AED" },
};

const ORDER = ["INTEREST", "APTITUDE", "PERSONALITY", "VALUES"];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    COMPLETED:   { label: "Completed",   bg: "#D1FAE5", color: T.teal    },
    IN_PROGRESS: { label: "In Progress", bg: "#FEF3C7", color: "#D97706" },
    NOT_STARTED: { label: "Not Started", bg: T.secondary, color: T.primary },
  };
  const s = map[status] ?? map.NOT_STARTED;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, borderRadius: 99, padding: "3px 10px" }}>
      {s.label}
    </span>
  );
}

export function AssessmentsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    apiClient.get("/assessments/me")
      .then((r) => setSessions(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Map by type for easy lookup
  const sessionMap: Record<string, any> = {};
  for (const s of sessions) sessionMap[s.assessmentType] = s;

  const assessments = ORDER.map((type) => ({
    type,
    ...ASSESSMENT_META[type],
    totalQuestions: QUESTION_COUNTS[type] ?? 20,
    status:      sessionMap[type]?.status      ?? "NOT_STARTED",
    completedAt: sessionMap[type]?.completedAt ?? null,
    answerCount: sessionMap[type]?._count?.answers ?? 0,
    results:     sessionMap[type]?.results     ?? null,
  }));

  const completed = assessments.filter((a) => a.status === "COMPLETED").length;
  const pct       = Math.round((completed / assessments.length) * 100);
  const allDone   = completed === assessments.length;

  const handleAction = (type: string, status: string) => {
    router.push(`/learner/assessments/${type.toLowerCase()}`);
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px 48px", fontFamily: "inherit" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: T.fg }}>Discover Yourself</h1>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: T.muted }}>
          {allDone
            ? "All assessments complete — your career matches are ready!"
            : "Complete all 4 assessments to unlock your personalised career matches."}
        </p>

        {/* Progress bar */}
        <div style={{ background: T.card, borderRadius: 12, padding: "14px 18px", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.fg }}>
                {loading ? "Loading…" : `${completed} of ${assessments.length} complete`}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: allDone ? T.teal : T.primary }}>{pct}%</span>
            </div>
            <div style={{ height: 8, background: T.secondary, borderRadius: 99 }}>
              <div style={{
                width: `${pct}%`, height: "100%", borderRadius: 99,
                background: allDone ? T.teal : T.primary,
                transition: "width 0.5s ease",
              }} />
            </div>
          </div>
          {allDone && (
            <button
              onClick={() => router.push("/learner/matches")}
              style={{ padding: "8px 16px", borderRadius: 10, background: T.teal, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              View matches →
            </button>
          )}
        </div>
      </div>

      {/* 2×2 grid */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, color: T.muted, fontSize: 14 }}>
          Loading assessments…
        </div>
      ) : (
        <div className="assess-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {assessments.map((a, i) => {
            const isCompleted  = a.status === "COMPLETED";
            const isInProgress = a.status === "IN_PROGRESS";
            const btnLabel = isCompleted ? "Retake" : isInProgress ? "Continue →" : "Start →";
            const btnBg    = isCompleted ? T.secondary : a.color;
            const btnColor = isCompleted ? a.color : "#fff";

            return (
              <div
                key={a.type}
                style={{
                  background: T.card,
                  borderRadius: 16,
                  padding: 20,
                  border: isCompleted
                    ? `2px solid ${T.teal}`
                    : isInProgress
                    ? `2px solid ${a.color}50`
                    : `1px solid ${T.border}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Step number */}
                <div style={{
                  position: "absolute", top: 14, left: 16,
                  width: 22, height: 22, borderRadius: "50%",
                  background: isCompleted ? T.teal : `${a.color}18`,
                  color: isCompleted ? "#fff" : a.color,
                  fontSize: 11, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isCompleted ? "✓" : i + 1}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginLeft: 28 }}>
                  <span style={{ fontSize: 30 }}>{a.icon}</span>
                  <StatusBadge status={a.status} />
                </div>

                <h3 style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 700, color: T.fg }}>
                  {a.name} Assessment
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.55 }}>{a.desc}</p>

                {/* Progress hint for in-progress */}
                {isInProgress && a.answerCount > 0 && (
                  <p style={{ margin: 0, fontSize: 12, color: a.color, fontWeight: 600 }}>
                    {a.answerCount} of {a.totalQuestions} answered — pick up where you left off
                  </p>
                )}

                {/* Completed date */}
                {isCompleted && a.completedAt && (
                  <p style={{ margin: 0, fontSize: 12, color: T.teal, fontWeight: 600 }}>
                    ✓ Done {new Date(a.completedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                  </p>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 6 }}>
                  <span style={{ fontSize: 12, color: T.muted }}>⏱ ~{a.time}</span>
                  <button
                    onClick={() => handleAction(a.type, a.status)}
                    style={{
                      background: btnBg, color: btnColor, border: "none",
                      borderRadius: 8, padding: "8px 18px",
                      fontWeight: 700, fontSize: 13, cursor: "pointer",
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    {btnLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .assess-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
