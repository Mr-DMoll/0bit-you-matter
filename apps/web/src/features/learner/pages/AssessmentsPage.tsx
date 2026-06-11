"use client";

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

const assessments = [
  {
    id: "interest",
    icon: "🎯",
    name: "Interest Assessment",
    status: "completed",
    desc: "Discover what activities, subjects and environments energise you most.",
    time: "10 min",
  },
  {
    id: "aptitude",
    icon: "🧠",
    name: "Aptitude Assessment",
    status: "in-progress",
    desc: "Measure your strengths in reasoning, numeracy and problem-solving.",
    time: "20 min",
  },
  {
    id: "personality",
    icon: "✨",
    name: "Personality Assessment",
    status: "not-started",
    desc: "Understand how you interact with the world and what drives you.",
    time: "15 min",
  },
  {
    id: "values",
    icon: "💡",
    name: "Values Assessment",
    status: "not-started",
    desc: "Identify the core values that should shape your career path.",
    time: "10 min",
  },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    "completed":   { label: "Completed",   bg: "#D1FAE5", color: T.teal },
    "in-progress": { label: "In Progress", bg: "#FEF3C7", color: "#D97706" },
    "not-started": { label: "Not Started", bg: T.secondary, color: T.primary },
  };
  const s = map[status];
  return (
    <span style={{ fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, borderRadius: 99, padding: "3px 10px" }}>
      {s.label}
    </span>
  );
}

function ActionButton({ status }: { status: string }) {
  const label = status === "completed" ? "Redo" : status === "in-progress" ? "Continue" : "Start";
  const bg = status === "completed" ? T.secondary : T.primary;
  const color = status === "completed" ? T.primary : "#fff";
  return (
    <button style={{ background: bg, color, border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
      {label}
    </button>
  );
}

export function AssessmentsPage() {
  const completed = assessments.filter((a) => a.status === "completed").length;
  const total = assessments.length;
  const pct = Math.round((completed / total) * 100);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px 48px", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: T.fg }}>Discover Yourself</h1>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: T.muted }}>Complete all 4 assessments to unlock your personalised career matches.</p>

        {/* Progress bar */}
        <div style={{ background: T.card, borderRadius: 12, padding: "14px 18px", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.fg }}>{completed} of {total} complete</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.primary }}>{pct}%</span>
            </div>
            <div style={{ height: 8, background: T.secondary, borderRadius: 99 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: T.primary, borderRadius: 99 }} />
            </div>
          </div>
        </div>
      </div>

      {/* 2x2 grid */}
      <div className="assess-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {assessments.map((a) => (
          <div
            key={a.id}
            style={{
              background: T.card,
              borderRadius: 16,
              padding: 20,
              border: a.status === "completed" ? `2px solid ${T.teal}` : `1px solid ${T.border}`,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: 32 }}>{a.icon}</span>
              <StatusBadge status={a.status} />
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.fg }}>{a.name}</h3>
            <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.5 }}>{a.desc}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 4 }}>
              <span style={{ fontSize: 12, color: T.muted }}>⏱ {a.time}</span>
              <ActionButton status={a.status} />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .assess-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
