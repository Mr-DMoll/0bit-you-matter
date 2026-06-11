"use client";

import { CheckCircle, Circle } from "lucide-react";

const T = {
  primary:   "#5B4FCF",
  secondary: "#EEE9FF",
  coral:     "#F97066",
  teal:      "#0D9488",
  sidebar:   "#1E1875",
  bg:        "#FAFAF9",
  card:      "#FFFFFF",
  fg:        "#1A1535",
  muted:     "#7A7499",
  border:    "rgba(91,79,207,0.12)",
};

const MILESTONES = [
  {
    label: "Create profile",
    desc: "Set up your learner profile with your grade, province and subjects.",
    timeframe: "May 2026",
    done: true,
  },
  {
    label: "Interest Assessment",
    desc: "Complete the interest survey to discover what motivates you.",
    timeframe: "May 2026",
    done: true,
  },
  {
    label: "Aptitude Assessment",
    desc: "Measure your natural strengths in reasoning and numeracy.",
    timeframe: "Jun 2026",
    done: false,
  },
  {
    label: "Explore career matches",
    desc: "Browse careers that match your assessment results.",
    timeframe: "Jun 2026",
    done: false,
  },
  {
    label: "Research UCT",
    desc: "View UCT&apos;s programmes, APS requirements and application process.",
    timeframe: "Jul 2026",
    done: false,
  },
  {
    label: "Apply Investec bursary",
    desc: "Submit your application for the Investec STEM Bursary.",
    timeframe: "Aug 2026",
    done: false,
  },
  {
    label: "Submit NSFAS application",
    desc: "Apply for government funding through the NSFAS portal.",
    timeframe: "Sep 2026",
    done: false,
  },
  {
    label: "University applications",
    desc: "Submit applications to your chosen universities through the CAO.",
    timeframe: "Oct 2026",
    done: false,
  },
];

export function MilestonesPage() {
  const doneCount = MILESTONES.filter((m) => m.done).length;
  const total = MILESTONES.length;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px 48px", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: T.fg }}>My Milestones</h1>
        <p style={{ margin: 0, fontSize: 14, color: T.muted }}>Track your journey to your dream career</p>
      </div>

      {/* Progress summary */}
      <div style={{ background: T.card, borderRadius: 14, padding: 18, border: `1px solid ${T.border}`, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.fg }}>{doneCount} of {total} complete</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.primary }}>{pct}%</span>
        </div>
        <div style={{ height: 10, background: T.secondary, borderRadius: 99 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: T.primary, borderRadius: 99, transition: "width 0.4s ease" }} />
        </div>
      </div>

      {/* Milestone cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {MILESTONES.map((m, i) => (
          <div
            key={i}
            style={{
              background: T.card,
              borderRadius: 14,
              padding: 18,
              border: m.done ? `1.5px solid ${T.teal}` : `1px solid ${T.border}`,
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
            }}
          >
            <div style={{ flexShrink: 0, marginTop: 2 }}>
              {m.done
                ? <CheckCircle size={22} color={T.teal} />
                : <Circle size={22} color={T.muted} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: m.done ? T.muted : T.fg, textDecoration: m.done ? "line-through" : "none" }}>
                  {m.label}
                </h3>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  background: m.done ? "#D1FAE5" : T.secondary,
                  color: m.done ? T.teal : T.primary,
                  borderRadius: 99,
                  padding: "3px 10px",
                  whiteSpace: "nowrap",
                }}>
                  {m.timeframe}
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: T.muted, lineHeight: 1.5 }}>{m.desc}</p>
              {!m.done && (
                <button style={{ marginTop: 12, background: "none", color: T.primary, border: `1.5px solid ${T.primary}`, borderRadius: 8, padding: "6px 14px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Encouragement footer */}
      <div style={{ background: `linear-gradient(135deg, ${T.primary} 0%, #7C6FE0 100%)`, borderRadius: 14, padding: 20, marginTop: 24, color: "#fff", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 32 }}>💪</span>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>Keep pushing forward!</p>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>
            Every milestone you complete brings you one step closer to your future career. You&apos;ve got this!
          </p>
        </div>
      </div>
    </div>
  );
}
