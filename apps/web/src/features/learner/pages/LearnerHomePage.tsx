"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/client";
import { useAuth } from "@/shared/context/AuthContext";

const ASSESSMENT_TYPES = ["INTEREST", "APTITUDE", "PERSONALITY", "VALUES"] as const;
const TYPE_COLOR: Record<string, string> = {
  INTEREST: "#6366f1", APTITUDE: "#3b82f6", PERSONALITY: "#8b5cf6", VALUES: "#f59e0b",
};
const TYPE_DESC: Record<string, string> = {
  INTEREST:    "Discover what truly excites you",
  APTITUDE:    "Find out where your natural talents lie",
  PERSONALITY: "Understand how you work best",
  VALUES:      "What matters most to you in a career",
};

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const r  = 28;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="68" height="68" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="34" cy="34" r={r} fill="none" stroke="var(--color-border)" strokeWidth="5" />
      <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

export function LearnerHomePage() {
  const router = useRouter();
  const { user } = useAuth() as any;
  const [profile, setProfile]     = useState<any>(null);
  const [sessions, setSessions]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get("/learner/profile"),
    ])
      .then(([pRes]) => {
        setProfile(pRes.data.data?.learnerProfile ?? null);
        setSessions(pRes.data.data?.assessmentSessions ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.firstName ?? user?.displayName?.split(" ")[0] ?? "there";

  const getStatus = (type: string) => {
    const s = sessions.find((s: any) => s.assessmentType === type);
    if (!s) return "not_started";
    return s.status === "COMPLETED" ? "completed" : "in_progress";
  };

  const completedCount = ASSESSMENT_TYPES.filter((t) => getStatus(t) === "completed").length;
  const pct            = Math.round((completedCount / 4) * 100);

  const nextAction = (() => {
    if (completedCount < 4) {
      const next = ASSESSMENT_TYPES.find((t) => getStatus(t) !== "completed");
      return { label: `Start ${next} assessment`, href: `/learner/assessments` };
    }
    if (!profile?.chosenCareerId) {
      return { label: "Explore careers & choose one", href: "/learner/explore" };
    }
    return { label: "Check your roadmap", href: "/learner/roadmap" };
  })();

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* ── Greeting ── */}
      <div>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{greeting} 👋</p>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", marginTop: "2px" }}>
          {firstName}
        </h1>
        {profile?.riasecType && (
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
            Your type: <strong style={{ color: "var(--color-accent)" }}>{profile.riasecType}</strong>
          </p>
        )}
      </div>

      {/* ── Progress card ── */}
      <div style={{
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        borderRadius: "16px",
        padding: "20px",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <ProgressRing pct={pct} color="#fff" />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, transform: "rotate(90deg)", display: "inline-block" }}>{pct}%</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "15px", fontWeight: 700 }}>Your profile journey</p>
          <p style={{ fontSize: "12px", opacity: 0.85, marginTop: "2px" }}>
            {completedCount} of 4 assessments done
          </p>
          {completedCount < 4 && (
            <p style={{ fontSize: "11px", opacity: 0.7, marginTop: "4px" }}>
              Complete all 4 to unlock your AI career profile
            </p>
          )}
        </div>
      </div>

      {/* ── Next action ── */}
      <button
        onClick={() => router.push(nextAction.href)}
        style={{
          width: "100%", padding: "16px", background: "var(--color-bg-secondary)",
          border: "2px solid var(--color-accent)", borderRadius: "12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", textAlign: "left",
        }}
      >
        <div>
          <p style={{ fontSize: "11px", color: "var(--color-accent)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Suggested next step</p>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", marginTop: "2px" }}>{nextAction.label}</p>
        </div>
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "#fff", fontSize: "16px" }}>→</span>
        </div>
      </button>

      {/* ── Assessment status grid ── */}
      <div>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Assessments</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {ASSESSMENT_TYPES.map((type) => {
            const status = getStatus(type);
            const color  = TYPE_COLOR[type];
            return (
              <button
                key={type}
                onClick={() => router.push("/learner/assessments")}
                style={{
                  padding: "14px", background: "var(--color-bg-secondary)",
                  border: `1px solid ${status === "completed" ? color : "var(--color-border)"}`,
                  borderRadius: "12px", cursor: "pointer", textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
                  <span style={{ fontSize: "11px", color: status === "completed" ? "#22c55e" : status === "in_progress" ? "#f59e0b" : "var(--color-text-muted)" }}>
                    {status === "completed" ? "✓ Done" : status === "in_progress" ? "In progress" : "Not started"}
                  </span>
                </div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{type}</p>
                <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px", lineHeight: 1.3 }}>{TYPE_DESC[type]}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Quick links ── */}
      {completedCount >= 2 && (
        <div>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Quick links</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { label: "Explore careers",    sub: "Browse by cluster",         href: "/learner/explore" },
              { label: "Find bursaries",     sub: "Money for your studies",    href: "/learner/bursaries" },
              { label: "Universities",       sub: "Check APS requirements",    href: "/learner/universities" },
              { label: "Guidance chat",      sub: "Ask me anything",           href: "/learner/chat" },
            ].map(({ label, sub, href }) => (
              <button
                key={href}
                onClick={() => router.push(href)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", background: "var(--color-bg-secondary)",
                  border: "1px solid var(--color-border)", borderRadius: "12px",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>{label}</p>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{sub}</p>
                </div>
                <span style={{ color: "var(--color-text-muted)", fontSize: "18px" }}>›</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
