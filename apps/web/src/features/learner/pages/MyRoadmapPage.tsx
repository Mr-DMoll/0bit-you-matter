"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/client";

const PHASE_COLORS = ["#6366f1", "#3b82f6", "#8b5cf6", "#f59e0b", "#22c55e"];

export function MyRoadmapPage() {
  const router  = useRouter();
  const [roadmap, setRoadmap]     = useState<any>(null);
  const [profile, setProfile]     = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get("/learner/profile"),
      apiClient.get("/learner/roadmap").catch(() => ({ data: { data: null } })),
    ])
      .then(([pRes, rRes]) => {
        setProfile(pRes.data.data?.learnerProfile ?? null);
        setRoadmap(rRes.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const generateRoadmap = async () => {
    setGenerating(true);
    try {
      const r = await apiClient.post("/learner/roadmap/generate");
      setRoadmap(r.data.data);
    } catch {}
    setGenerating(false);
  };

  if (loading) {
    return <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "60px 0" }}>Loading roadmap…</p>;
  }

  if (!profile?.chosenCareerId) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100svh - 200px)", textAlign: "center", gap: "16px", padding: "0 8px" }}>
        <div style={{ fontSize: "48px" }}>🗺️</div>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-text-primary)" }}>Choose a career first</h2>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.5, maxWidth: "280px" }}>
          Your roadmap is personalised to your chosen career. Explore careers and select the one that excites you.
        </p>
        <button
          onClick={() => router.push("/learner/explore")}
          style={{ padding: "12px 24px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
        >
          Explore careers →
        </button>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100svh - 200px)", textAlign: "center", gap: "16px", padding: "0 8px" }}>
        <div style={{ fontSize: "48px" }}>✨</div>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-text-primary)" }}>Generate your roadmap</h2>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.5, maxWidth: "280px" }}>
          AI will create a personalised step-by-step plan to help you reach your career goal.
        </p>
        <button
          onClick={generateRoadmap}
          disabled={generating}
          style={{ padding: "12px 24px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: generating ? "not-allowed" : "pointer" }}
        >
          {generating ? "Generating your roadmap…" : "✨ Generate roadmap"}
        </button>
      </div>
    );
  }

  const phases: any[] = roadmap.phases ?? [];
  const milestones: any[] = roadmap.milestones ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)" }}>My Roadmap</h1>
        {profile?.chosenCareer?.title && (
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
            Path to: <strong style={{ color: "var(--color-accent)" }}>{profile.chosenCareer.title}</strong>
          </p>
        )}
      </div>

      {/* Summary card */}
      {roadmap.summary && (
        <div style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: "14px", padding: "16px", color: "#fff" }}>
          <p style={{ fontSize: "13px", lineHeight: 1.6, opacity: 0.95 }}>{roadmap.summary}</p>
        </div>
      )}

      {/* Phases */}
      {phases.length > 0 && (
        <div>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "12px" }}>Your journey</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {phases.map((phase: any, idx: number) => {
              const color = PHASE_COLORS[idx % PHASE_COLORS.length];
              return (
                <div key={idx} style={{ display: "flex", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#fff" }}>{idx + 1}</div>
                    {idx < phases.length - 1 && <div style={{ width: "2px", flex: 1, background: "var(--color-border)", marginTop: "4px" }} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: idx < phases.length - 1 ? "16px" : "0" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{phase.title}</p>
                      {phase.duration && <span style={{ fontSize: "11px", color, fontWeight: 600 }}>{phase.duration}</span>}
                    </div>
                    {phase.description && (
                      <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{phase.description}</p>
                    )}
                    {phase.actions && phase.actions.length > 0 && (
                      <ul style={{ marginTop: "8px", paddingLeft: "0", listStyle: "none", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {phase.actions.map((a: string, ai: number) => (
                          <li key={ai} style={{ display: "flex", gap: "8px", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                            <span style={{ color, flexShrink: 0 }}>→</span>{a}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Milestones shortcut */}
      {milestones.length > 0 && (
        <button
          onClick={() => router.push("/learner/milestones")}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border)", borderRadius: "12px",
            cursor: "pointer", textAlign: "left",
          }}
        >
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>Track milestones</p>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{milestones.filter((m: any) => m.status === "COMPLETED").length} / {milestones.length} complete</p>
          </div>
          <span style={{ color: "var(--color-text-muted)", fontSize: "18px" }}>›</span>
        </button>
      )}

      <button
        onClick={generateRoadmap}
        disabled={generating}
        style={{ padding: "12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "10px", fontSize: "13px", color: "var(--color-text-muted)", cursor: generating ? "not-allowed" : "pointer" }}
      >
        {generating ? "Regenerating…" : "↻ Regenerate roadmap"}
      </button>
    </div>
  );
}
