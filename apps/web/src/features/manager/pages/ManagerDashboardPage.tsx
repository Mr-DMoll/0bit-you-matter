"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/context/AuthContext";
import apiClient from "@/api/client";
import {
  PageHeader, Card, StatCard, Spinner, Btn,
} from "@/features/admin/components/AdminShell";

export function ManagerDashboardPage() {
  const router        = useRouter();
  const { user }      = useAuth();
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/manager/dashboard")
      .then((r) => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.firstName || user?.displayName?.split(" ")[0] || "Manager";

  if (loading) return <Spinner />;

  const stats = [
    { label: "My Learners",          value: data?.totalLearners        ?? 0, accent: "var(--color-accent)" },
    { label: "Assessments done",     value: data?.completedAssessments ?? 0, accent: "#22c55e" },
    { label: "At risk",              value: data?.atRiskCount          ?? 0, accent: data?.atRiskCount > 0 ? "#ef4444" : undefined },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 600, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
          Good day, {firstName}
        </h1>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "3px" }}>
          Here's a summary of your cohort
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
        {stats.map((s) => <StatCard key={s.label} label={s.label} value={s.value} accent={s.accent} />)}
      </div>

      {(data?.atRiskCount ?? 0) > 0 && (
        <div style={{ padding: "12px 18px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#ef4444" }}>
            ⚠️ {data.atRiskCount} learner{data.atRiskCount > 1 ? "s" : ""} at risk — inactive for 14+ days
          </p>
          <Btn label="View at risk" onClick={() => router.push("/manager/at-risk")} variant="ghost" small />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Card title="Quick actions">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { label: "View my learners",   href: "/manager/learners" },
              { label: "At-risk learners",   href: "/manager/at-risk" },
              { label: "Start group session",href: "/manager/group-session" },
              { label: "Review queue",       href: "/manager/review-queue" },
              { label: "Request content",    href: "/manager/generation-requests" },
              { label: "Export reports",     href: "/manager/reports" },
            ].map(({ label, href }) => (
              <button
                key={href}
                onClick={() => router.push(href)}
                style={{ padding: "9px 14px", fontSize: "13px", fontWeight: 500, background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", cursor: "pointer", color: "var(--color-text-primary)", textAlign: "left" }}
              >
                {label} →
              </button>
            ))}
          </div>
        </Card>

        <Card title="Cohort progress">
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[
              { label: "Interest assessment",    color: "#6366f1" },
              { label: "Aptitude assessment",    color: "#3b82f6" },
              { label: "Personality assessment", color: "#8b5cf6" },
              { label: "Values assessment",      color: "#f59e0b" },
            ].map(({ label, color }) => (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{label}</span>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                    {data?.totalLearners ? "—" : "No learners yet"}
                  </span>
                </div>
                <div style={{ height: "6px", background: "var(--color-border)", borderRadius: "3px" }}>
                  <div style={{ height: "100%", width: "0%", background: color, borderRadius: "3px" }} />
                </div>
              </div>
            ))}
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              Completion rates populate as learners finish assessments.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
