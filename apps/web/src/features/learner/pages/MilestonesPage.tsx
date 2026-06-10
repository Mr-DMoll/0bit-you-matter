"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/client";

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  PENDING:    { color: "#94a3b8", label: "To do"       },
  IN_PROGRESS:{ color: "#f59e0b", label: "In progress" },
  COMPLETED:  { color: "#22c55e", label: "Done"        },
  SKIPPED:    { color: "#64748b", label: "Skipped"     },
};

export function MilestonesPage() {
  const router = useRouter();
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [updating, setUpdating]     = useState<string | null>(null);

  useEffect(() => {
    apiClient.get("/learner/milestones")
      .then((r) => setMilestones(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await apiClient.patch(`/learner/milestones/${id}`, { status });
      setMilestones((prev) => prev.map((m) => m.id === id ? { ...m, status } : m));
    } catch {}
    setUpdating(null);
  };

  const completed = milestones.filter((m) => m.status === "COMPLETED").length;
  const pct       = milestones.length > 0 ? Math.round((completed / milestones.length) * 100) : 0;

  if (loading) {
    return <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "60px 0" }}>Loading milestones…</p>;
  }

  if (milestones.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100svh - 200px)", textAlign: "center", gap: "16px", padding: "0 8px" }}>
        <div style={{ fontSize: "48px" }}>🏁</div>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-text-primary)" }}>No milestones yet</h2>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.5, maxWidth: "280px" }}>
          Generate your roadmap first — milestones will appear here so you can track your progress.
        </p>
        <button
          onClick={() => router.push("/learner/roadmap")}
          style={{ padding: "12px 24px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
        >
          Go to roadmap →
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)" }}>Milestones</h1>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
          {completed} of {milestones.length} complete
        </p>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Overall progress</span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-accent)" }}>{pct}%</span>
        </div>
        <div style={{ height: "8px", background: "var(--color-border)", borderRadius: "4px" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #6366f1, #8b5cf6)", borderRadius: "4px", transition: "width 0.4s ease" }} />
        </div>
      </div>

      {/* Milestone list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {milestones.map((m, idx) => {
          const style = STATUS_STYLE[m.status] ?? STATUS_STYLE.PENDING;
          const isUpdating = updating === m.id;
          return (
            <div
              key={m.id}
              style={{
                padding: "14px 16px",
                background: "var(--color-bg-secondary)",
                border: `1px solid ${m.status === "COMPLETED" ? "#22c55e40" : "var(--color-border)"}`,
                borderRadius: "12px",
                opacity: m.status === "SKIPPED" ? 0.5 : 1,
              }}
            >
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                {/* number bubble */}
                <div style={{
                  width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0,
                  background: m.status === "COMPLETED" ? "#22c55e" : m.status === "IN_PROGRESS" ? "#f59e0b" : "var(--color-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 700, color: m.status === "PENDING" ? "var(--color-text-muted)" : "#fff",
                }}>
                  {m.status === "COMPLETED" ? "✓" : idx + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2px" }}>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{m.title}</p>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: style.color }}>{style.label}</span>
                  </div>
                  {m.description && <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.5, marginBottom: "10px" }}>{m.description}</p>}
                  {m.dueDate && (
                    <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "10px" }}>
                      Due: {new Date(m.dueDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}

                  {/* Status toggle buttons */}
                  {m.status !== "COMPLETED" && (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {m.status === "PENDING" && (
                        <button
                          disabled={isUpdating}
                          onClick={() => updateStatus(m.id, "IN_PROGRESS")}
                          style={{ padding: "6px 12px", background: "#f59e0b20", border: "1px solid #f59e0b", borderRadius: "8px", fontSize: "11px", fontWeight: 600, color: "#f59e0b", cursor: "pointer" }}
                        >
                          Start
                        </button>
                      )}
                      {(m.status === "PENDING" || m.status === "IN_PROGRESS") && (
                        <button
                          disabled={isUpdating}
                          onClick={() => updateStatus(m.id, "COMPLETED")}
                          style={{ padding: "6px 12px", background: "#22c55e20", border: "1px solid #22c55e", borderRadius: "8px", fontSize: "11px", fontWeight: 600, color: "#22c55e", cursor: "pointer" }}
                        >
                          {isUpdating ? "…" : "Mark done ✓"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
