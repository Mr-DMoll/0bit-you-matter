"use client";

import { useState, useEffect } from "react";
import apiClient from "@/api/client";
import { PageHeader, Card, StatCard, Spinner, Empty } from "../components/AdminShell";

export function AdminPlatformGrowthPage() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/admin/dashboard")
      .then((r) => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader title="Platform Growth" subtitle="Registrations, retention, province and school coverage" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
        <StatCard label="Total learners"   value={data?.totalLearners  ?? 0} accent="var(--color-accent)" />
        <StatCard label="Pending invites"  value={data?.pendingInvites ?? 0} accent="#f59e0b" />
        <StatCard label="7-day retention"  value="—" sub="Coming soon" />
        <StatCard label="Schools covered"  value="—" sub="Coming soon" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Card title="Registrations Over Time">
          <Empty message="Time-series registration data will populate as learners join." />
        </Card>
        <Card title="Province Coverage">
          <Empty message="Province data will populate as learners complete their profiles." />
        </Card>
      </div>
    </div>
  );
}
