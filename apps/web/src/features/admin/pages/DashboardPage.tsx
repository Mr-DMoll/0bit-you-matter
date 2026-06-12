"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/client";
import {
  PageHeader, Card, StatCard, Table, TableRow,
  Spinner, Empty, Btn, timeAgo, displayName,
} from "../components/AdminShell";

const QUICK_LINKS = [
  { label: "View all learners",  href: "/admin/learners",         icon: "👥", color: "#5B4FCF" },
  { label: "Review queue",       href: "/admin/review-queue",     icon: "📋", color: "#0D9488" },
  { label: "Careers library",    href: "/admin/careers",          icon: "💼", color: "#7C3AED" },
  { label: "AI pipeline",        href: "/admin/ai-pipeline",      icon: "🤖", color: "#2563EB" },
  { label: "Analytics",          href: "/admin/analytics",        icon: "📊", color: "#D97706" },
  { label: "Update planner",     href: "/admin/update-planner",   icon: "🗓️", color: "#DC2626" },
];

// Action label cleanup
function formatAction(action: string) {
  return action.replace(/_/g, " ").toLowerCase();
}

// Colour-code action type
function actionColor(action: string) {
  const a = action.toLowerCase();
  if (a.includes("login"))   return "#0D9488";
  if (a.includes("chat"))    return "#5B4FCF";
  if (a.includes("match"))   return "#7C3AED";
  if (a.includes("profile")) return "#2563EB";
  if (a.includes("career"))  return "#D97706";
  return "#6B7280";
}

export function AdminDashboardPage() {
  const router  = useRouter();
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/admin/dashboard")
      .then((r) => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const stats = [
    { label: "Total Learners",    value: data?.totalLearners        ?? 0, sub: "registered",      color: "#5B4FCF", icon: "🎓" },
    { label: "Managers",          value: data?.totalManagers        ?? 0, sub: "active",           color: "#0D9488", icon: "🏢" },
    { label: "Content Managers",  value: data?.totalContentManagers ?? 0, sub: "active",           color: "#7C3AED", icon: "✍️" },
    { label: "Reviewers",         value: data?.totalReviewers       ?? 0, sub: "active",           color: "#2563EB", icon: "🔍" },
    { label: "Data Verifiers",    value: data?.totalDataVerifiers   ?? 0, sub: "active",           color: "#059669", icon: "✅" },
    { label: "Pending Invites",   value: data?.pendingInvites       ?? 0, sub: "awaiting set-up",  color: (data?.pendingInvites ?? 0) > 0 ? "#D97706" : "#94A3B8", icon: "📨" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader title="Admin Dashboard" subtitle="Platform overview — people, content and activity" />

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} color={s.color} icon={s.icon} />
        ))}
      </div>

      {/* Bottom grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px" }}>

        {/* Recent Activity */}
        <Card title="Recent Activity" action={<Btn label="View all" onClick={() => router.push("/admin/activity")} variant="ghost" small />}>
          {(data?.recentActivity?.length ?? 0) === 0 ? <Empty message="No activity yet" /> : (
            <Table headers={["User", "Action", "When"]}>
              {data.recentActivity.map((log: any) => {
                const color = actionColor(log.action);
                return (
                  <TableRow
                    key={log.id}
                    cols={[
                      <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{displayName(log.user)}</span>,
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        fontSize: 12, fontWeight: 600, padding: "2px 10px",
                        borderRadius: 20,
                        background: `${color}12`, color, border: `1px solid ${color}28`,
                      }}>
                        {formatAction(log.action)}
                      </span>,
                      <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>{timeAgo(log.createdAt)}</span>,
                    ]}
                  />
                );
              })}
            </Table>
          )}
        </Card>

        {/* Quick Links */}
        <Card title="Quick Links">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {QUICK_LINKS.map(({ label, href, icon, color }) => (
              <button
                key={href}
                onClick={() => router.push(href)}
                style={{
                  padding: "10px 14px",
                  fontSize: "13px", fontWeight: 500,
                  background: `${color}08`,
                  border: `1px solid ${color}20`,
                  borderLeft: `3px solid ${color}`,
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  color: "var(--color-text-primary)",
                  textAlign: "left",
                  display: "flex", alignItems: "center", gap: 10,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${color}14`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${color}08`; }}
              >
                <span style={{ fontSize: 16 }}>{icon}</span>
                {label}
                <span style={{ marginLeft: "auto", color, opacity: 0.6, fontSize: 14 }}>→</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
