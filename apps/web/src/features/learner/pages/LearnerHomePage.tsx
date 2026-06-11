"use client";

import { Bell, CheckCircle, Circle } from "lucide-react";
import Link from "next/link";

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

function CircleProgress({ pct, label, color }: { pct: number; label: string; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
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
    </div>
  );
}

const recentActivity = [
  { emoji: "🎯", text: "Completed Interest Assessment", time: "2h ago" },
  { emoji: "🔍", text: "Explored Software Engineer career", time: "Yesterday" },
  { emoji: "📚", text: "Viewed UCT university profile", time: "2 days ago" },
  { emoji: "💡", text: "Saved Investec Bursary", time: "3 days ago" },
];

const milestones = [
  { label: "Create profile", done: true },
  { label: "Complete Interest Assessment", done: true },
  { label: "Complete Aptitude Assessment", done: false },
  { label: "Explore career matches", done: false },
  { label: "Research target university", done: false },
];

const todos = [
  "Start Aptitude Assessment",
  "Explore top career matches",
  "Save 2 bursaries to apply",
];

export function LearnerHomePage() {
  const today = new Date().toLocaleDateString("en-ZA", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "24px 24px 48px", fontFamily: "inherit" }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: T.muted }}>{today}</p>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.fg }}>Good morning, Thabo 👋</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button style={{ background: "none", border: "none", cursor: "pointer", position: "relative" }}>
            <Bell size={22} color={T.muted} />
            <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, background: T.coral, borderRadius: "50%" }} />
          </button>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>TM</div>
        </div>
      </div>

      {/* 3-column top cards */}
      <div className="home-top-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Assessment Progress */}
        <Link href="/learner/assessments" style={{ textDecoration: "none" }}>
          <div style={{ background: T.card, borderRadius: 16, padding: 20, border: `1px solid ${T.border}`, height: "100%", boxSizing: "border-box" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: T.fg }}>Assessment Progress</h3>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <CircleProgress pct={100} label="Interest" color={T.teal} />
              <CircleProgress pct={0} label="Aptitude" color={T.primary} />
              <CircleProgress pct={0} label="Personality" color={T.coral} />
              <CircleProgress pct={0} label="Values" color="#F59E0B" />
            </div>
          </div>
        </Link>

        {/* Top Career Match */}
        <Link href="/learner/explore" style={{ textDecoration: "none" }}>
          <div style={{ background: T.card, borderRadius: 16, padding: 20, border: `1px solid ${T.border}`, height: "100%", boxSizing: "border-box" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: T.fg }}>Top Career Match</h3>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: T.muted }}>Based on your profile</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { name: "Software Engineer", pct: 92 },
                { name: "Data Scientist", pct: 85 },
                { name: "UX Designer", pct: 78 },
              ].map((c) => (
                <div key={c.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: T.fg }}>{c.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.coral }}>{c.pct}%</span>
                  </div>
                  <div style={{ height: 6, background: T.secondary, borderRadius: 99 }}>
                    <div style={{ width: `${c.pct}%`, height: "100%", background: T.coral, borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Link>

        {/* Today's Action */}
        <div style={{ background: `linear-gradient(135deg, ${T.primary} 0%, #7C6FE0 100%)`, borderRadius: 16, padding: 20, color: "#fff", height: "100%", boxSizing: "border-box" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>Today&apos;s Action</h3>
          <p style={{ margin: "0 0 16px", fontSize: 12, opacity: 0.75 }}>3 tasks to keep you on track</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {todos.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 12px" }}>
                <Circle size={16} color="rgba(255,255,255,0.6)" />
                <span style={{ fontSize: 13 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2-column bottom */}
      <div className="home-bottom-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Recent Activity */}
        <div style={{ background: T.card, borderRadius: 16, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: T.fg }}>Recent Activity</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentActivity.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>{a.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, color: T.fg }}>{a.text}</p>
                  <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Milestones */}
        <div style={{ background: T.card, borderRadius: 16, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: T.fg }}>Upcoming Milestones</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {milestones.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {m.done
                  ? <CheckCircle size={18} color={T.teal} />
                  : <Circle size={18} color={T.muted} />}
                <span style={{ fontSize: 13, color: m.done ? T.muted : T.fg, textDecoration: m.done ? "line-through" : "none" }}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .home-top-grid { grid-template-columns: 1fr !important; }
          .home-bottom-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
