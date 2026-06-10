"use client";

import { useState, useEffect } from "react";
import apiClient from "@/api/client";
import { PageHeader, Card, StatCard, Spinner, Empty } from "../components/AdminShell";

export function AdminContentAnalyticsPage() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get("/careers", { params: { page: 1 } }),
      apiClient.get("/content/jobs", { params: { page: 1, status: "COMPLETED" } }),
    ])
      .then(([c, j]) => setData({ totalCareers: c.data.data.pagination.total, completedJobs: j.data.data.pagination.total }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader title="Content Analytics" subtitle="Career views, assessment engagement and AI guidance patterns" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
        <StatCard label="Total careers"       value={data?.totalCareers  ?? 0} accent="var(--color-accent)" />
        <StatCard label="AI generations done" value={data?.completedJobs ?? 0} accent="#22c55e" />
        <StatCard label="Most viewed career"  value="—" sub="Populates with traffic" />
        <StatCard label="Guidance chats"      value="—" sub="Populates with usage" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Card title="Most Viewed Careers">
          <Empty message="Career view data will populate as learners explore." />
        </Card>
        <Card title="Most Common Guidance Questions">
          <Empty message="Chat data will populate as learners use the AI guide." />
        </Card>
      </div>

      <Card title="Assessment Drop-off">
        <Empty message="Drop-off analytics will populate as learners complete assessments." />
      </Card>
    </div>
  );
}
