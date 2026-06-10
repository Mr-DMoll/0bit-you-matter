"use client";

import { useState, useEffect } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, StatCard, Spinner, Empty,
} from "../components/AdminShell";

export function AdminLearnerInsightsPage() {
  const [data, setData]   = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/admin/dashboard")
      .then((r) => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const totalLearners = data?.totalLearners ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader title="Learner Insights" subtitle="Assessment completion, engagement and exploration patterns" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
        <StatCard label="Total Learners"   value={totalLearners} accent="var(--color-accent)" />
        <StatCard label="Active this week" value="—" sub="Analytics coming soon" />
        <StatCard label="Profiles generated" value="—" sub="Analytics coming soon" />
        <StatCard label="Avg. engagement"  value="—" sub="Analytics coming soon" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Card title="Assessment Completion Rate">
          {[
            { label: "Interest",    color: "#6366f1" },
            { label: "Aptitude",    color: "#3b82f6" },
            { label: "Personality", color: "#8b5cf6" },
            { label: "Values",      color: "#f59e0b" },
          ].map(({ label, color }) => (
            <div key={label} style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{label}</span>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>—</span>
              </div>
              <div style={{ height: "6px", background: "var(--color-border)", borderRadius: "3px" }}>
                <div style={{ height: "100%", width: "0%", background: color, borderRadius: "3px" }} />
              </div>
            </div>
          ))}
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "8px" }}>
            Detailed analytics will populate as learners complete assessments.
          </p>
        </Card>

        <Card title="Province Distribution">
          <Empty message="Province data will populate once learners register." />
        </Card>
      </div>

      <Card title="Most Explored Careers">
        <Empty message="Career exploration data will populate as learners browse." />
      </Card>
    </div>
  );
}
