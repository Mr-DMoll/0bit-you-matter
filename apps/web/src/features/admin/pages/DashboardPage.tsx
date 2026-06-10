"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/client";
import {
  PageHeader, Card, StatCard, Table, TableRow,
  statusBadge, Spinner, Empty, Btn, timeAgo, displayName,
} from "../components/AdminShell";

export function AdminDashboardPage() {
  const router  = useRouter();
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/admin/dashboard")
      .then((r) => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const stats = [
    { label: "Total Learners",       value: data?.totalLearners       ?? 0, sub: "registered",        accent: "var(--color-accent)" },
    { label: "Managers",             value: data?.totalManagers       ?? 0, sub: "active",             accent: undefined },
    { label: "Content Managers",     value: data?.totalContentManagers ?? 0, sub: "active",            accent: undefined },
    { label: "Reviewers",            value: data?.totalReviewers      ?? 0, sub: "active",             accent: undefined },
    { label: "Data Verifiers",       value: data?.totalDataVerifiers  ?? 0, sub: "active",             accent: undefined },
    { label: "Pending Invites",      value: data?.pendingInvites      ?? 0, sub: "awaiting set-up",   accent: (data?.pendingInvites ?? 0) > 0 ? "#f59e0b" : undefined },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader title="Admin Dashboard" subtitle="Platform overview — people, content and activity" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
        {stats.map((s) => <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} accent={s.accent} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px" }}>
        <Card title="Recent Activity" action={<Btn label="View all" onClick={() => router.push("/admin/activity")} variant="ghost" small />}>
          {(data?.recentActivity?.length ?? 0) === 0 ? <Empty message="No activity yet" /> : (
            <Table headers={["User", "Action", "When"]}>
              {data.recentActivity.map((log: any) => (
                <TableRow
                  key={log.id}
                  cols={[
                    <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{displayName(log.user)}</span>,
                    <span>{log.action.replace(/_/g, " ").toLowerCase()}</span>,
                    <span style={{ color: "var(--color-text-muted)" }}>{timeAgo(log.createdAt)}</span>,
                  ]}
                />
              ))}
            </Table>
          )}
        </Card>

        <Card title="Quick Links">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { label: "View all learners",   href: "/admin/learners" },
              { label: "Review queue",        href: "/admin/review-queue" },
              { label: "Careers library",     href: "/admin/careers" },
              { label: "AI pipeline",         href: "/admin/ai-pipeline" },
              { label: "Learner insights",    href: "/admin/learner-insights" },
              { label: "Update planner",      href: "/admin/update-planner" },
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
      </div>
    </div>
  );
}
