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

const MILESTONES = [
  { label: "Create profile",            status: "done",    date: "May 2026" },
  { label: "Interest Assessment",       status: "done",    date: "May 2026" },
  { label: "Aptitude Assessment",       status: "current", date: "Jun 2026" },
  { label: "Explore career matches",    status: "future",  date: "Jun 2026" },
  { label: "Research UCT",              status: "future",  date: "Jul 2026" },
  { label: "Apply Investec bursary",    status: "future",  date: "Aug 2026" },
  { label: "Submit NSFAS",              status: "future",  date: "Sep 2026" },
  { label: "University applications",   status: "future",  date: "Oct 2026" },
];

const NEXT_ACTIONS = [
  "Complete the Aptitude Assessment",
  "Browse top career matches",
  "Save at least 2 bursaries",
];

export function MyRoadmapPage() {
  const doneCount = MILESTONES.filter((m) => m.status === "done").length;
  const total = MILESTONES.length;
  const pct = Math.round((doneCount / total) * 100);

  // SVG circular progress
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px 48px", fontFamily: "inherit" }}>
      {/* Summary card */}
      <div style={{ background: T.card, borderRadius: 16, padding: 24, border: `1px solid ${T.border}`, marginBottom: 24, display: "flex", alignItems: "center", gap: 24 }}>
        <svg width={108} height={108} style={{ flexShrink: 0 }}>
          <circle cx={54} cy={54} r={r} fill="none" stroke={T.border} strokeWidth={8} />
          <circle
            cx={54} cy={54} r={r} fill="none"
            stroke={T.primary} strokeWidth={8}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 54 54)"
          />
          <text x={54} y={54} textAnchor="middle" fontSize={16} fontWeight={700} fill={T.fg} dy={5}>{pct}%</text>
        </svg>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: T.fg }}>My Career Roadmap</h1>
          <p style={{ margin: "0 0 6px", fontSize: 14, color: T.muted }}>Target: <strong style={{ color: T.fg }}>Software Engineer</strong> at UCT</p>
          <p style={{ margin: 0, fontSize: 13, color: T.muted }}>{doneCount} of {total} milestones complete</p>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="roadmap-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Left: milestone timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: T.fg }}>Milestones</h3>
          {MILESTONES.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 12, position: "relative" }}>
              {/* Connector line */}
              {i < MILESTONES.length - 1 && (
                <div style={{ position: "absolute", left: 11, top: 24, width: 2, height: "calc(100% - 4px)", background: T.border, zIndex: 0 }} />
              )}
              {/* Dot */}
              <div style={{ flexShrink: 0, position: "relative", zIndex: 1 }}>
                {m.status === "done" ? (
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: T.teal, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#fff", fontSize: 12 }}>✓</span>
                  </div>
                ) : m.status === "current" ? (
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: T.primary, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 5px ${T.secondary}` }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
                  </div>
                ) : (
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: T.border, border: `2px solid ${T.muted}` }} />
                )}
              </div>
              {/* Content */}
              <div style={{ paddingBottom: 20 }}>
                <p style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: m.status === "current" ? 700 : 500,
                  color: m.status === "done" ? T.muted : T.fg,
                  textDecoration: m.status === "done" ? "line-through" : "none",
                }}>
                  {m.label}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: T.muted }}>{m.date}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Right: countdown + next actions + encouragement */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Countdown */}
          <div style={{ background: T.coral, borderRadius: 14, padding: 20, color: "#fff" }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, opacity: 0.85 }}>⏰ Application deadline</p>
            <h2 style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 800 }}>111 days</h2>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>until UCT applications close</p>
          </div>

          {/* Next Actions */}
          <div style={{ background: T.card, borderRadius: 14, padding: 18, border: `1px solid ${T.border}` }}>
            <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: T.fg }}>Next Actions</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {NEXT_ACTIONS.map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.primary, marginTop: 6, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: T.fg }}>{a}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Encouragement */}
          <div style={{ background: `linear-gradient(135deg, ${T.primary} 0%, #7C6FE0 100%)`, borderRadius: 14, padding: 18, color: "#fff" }}>
            <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>You&apos;re doing great! 🌟</p>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.85, lineHeight: 1.5 }}>
              Keep going — every milestone brings you closer to your dream career.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .roadmap-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
