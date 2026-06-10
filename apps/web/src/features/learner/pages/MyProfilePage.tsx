"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/client";

const RIASEC_COLORS: Record<string, string> = {
  R: "#ef4444", I: "#3b82f6", A: "#f59e0b",
  S: "#22c55e",  E: "#6366f1", C: "#8b5cf6",
};

export function MyProfilePage() {
  const router = useRouter();
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    apiClient.get("/learner/profile")
      .then((r) => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const generateProfile = async () => {
    setGenerating(true);
    try {
      await apiClient.post("/learner/profile/generate");
      const r = await apiClient.get("/learner/profile");
      setData(r.data.data);
    } catch {}
    setGenerating(false);
  };

  if (loading) {
    return <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "60px 0" }}>Loading profile…</p>;
  }

  const profile    = data?.learnerProfile;
  const sessions   = data?.assessmentSessions ?? [];
  const completedCount = sessions.filter((s: any) => s.status === "COMPLETED").length;
  const allDone    = completedCount === 4;

  const riasecScores: Record<string, number> = profile?.riasecScores as any ?? {};
  const topCodes = Object.entries(riasecScores).sort(([, a], [, b]) => b - a).slice(0, 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)" }}>My Profile</h1>

      {/* RIASEC type card */}
      {profile?.riasecType ? (
        <div style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: "16px", padding: "20px", color: "#fff" }}>
          <p style={{ fontSize: "12px", opacity: 0.8, marginBottom: "4px" }}>Your RIASEC type</p>
          <p style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "0.1em" }}>{profile.riasecType}</p>
          <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
            {topCodes.map(([code, score]) => (
              <div key={code} style={{ background: "rgba(255,255,255,0.2)", borderRadius: "8px", padding: "6px 12px", textAlign: "center" }}>
                <p style={{ fontSize: "14px", fontWeight: 700 }}>{code}</p>
                <p style={{ fontSize: "10px", opacity: 0.8 }}>{score}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ background: "var(--color-bg-secondary)", border: "2px dashed var(--color-border)", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "8px" }}>🧩</div>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>No profile yet</p>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
            {allDone ? "You've completed all assessments — generate your profile now!" : `Complete ${4 - completedCount} more assessment${4 - completedCount > 1 ? "s" : ""} first`}
          </p>
          {allDone && (
            <button
              onClick={generateProfile}
              disabled={generating}
              style={{ marginTop: "16px", padding: "12px 24px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: generating ? "not-allowed" : "pointer" }}
            >
              {generating ? "Generating…" : "✨ Generate my profile"}
            </button>
          )}
          {!allDone && (
            <button
              onClick={() => router.push("/learner/assessments")}
              style={{ marginTop: "16px", padding: "12px 24px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
            >
              Go to assessments →
            </button>
          )}
        </div>
      )}

      {/* Strengths summary */}
      {profile?.strengthsSummary && (
        <div style={{ background: "var(--color-bg-secondary)", borderRadius: "12px", padding: "16px", border: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>Your strengths</p>
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{profile.strengthsSummary}</p>
        </div>
      )}

      {/* Career goal */}
      {profile?.chosenCareerId ? (
        <div style={{ background: "var(--color-bg-secondary)", borderRadius: "12px", padding: "16px", border: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>Career goal</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>{profile.chosenCareer?.title ?? "Chosen career"}</p>
            <button
              onClick={() => router.push("/learner/explore")}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "var(--color-accent)" }}
            >
              Change
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => router.push("/learner/explore")}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px", background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border)", borderRadius: "12px",
            cursor: "pointer", textAlign: "left",
          }}
        >
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>Choose your career goal</p>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>Explore the career library to find your path</p>
          </div>
          <span style={{ color: "var(--color-text-muted)", fontSize: "18px" }}>›</span>
        </button>
      )}

      {/* RIASEC bars */}
      {Object.keys(riasecScores).length > 0 && (
        <div style={{ background: "var(--color-bg-secondary)", borderRadius: "12px", padding: "16px", border: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "12px" }}>RIASEC scores</p>
          {Object.entries(riasecScores)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([code, score]) => {
              const max = Math.max(...Object.values(riasecScores) as number[]);
              const pct = max > 0 ? ((score as number) / max) * 100 : 0;
              return (
                <div key={code} style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: RIASEC_COLORS[code] ?? "#94a3b8" }}>{code}</span>
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{score as number}</span>
                  </div>
                  <div style={{ height: "6px", background: "var(--color-border)", borderRadius: "3px" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: RIASEC_COLORS[code] ?? "#94a3b8", borderRadius: "3px", transition: "width 0.4s ease" }} />
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Assessment status */}
      <div style={{ background: "var(--color-bg-secondary)", borderRadius: "12px", padding: "16px", border: "1px solid var(--color-border)" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "12px" }}>Assessments</p>
        {["INTEREST", "APTITUDE", "PERSONALITY", "VALUES"].map((t) => {
          const s = sessions.find((s: any) => s.assessmentType === t);
          const done = s?.status === "COMPLETED";
          return (
            <div key={t} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{t[0] + t.slice(1).toLowerCase()}</span>
              <span style={{ fontSize: "12px", fontWeight: 600, color: done ? "#22c55e" : "var(--color-text-muted)" }}>{done ? "✓ Done" : "—"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
