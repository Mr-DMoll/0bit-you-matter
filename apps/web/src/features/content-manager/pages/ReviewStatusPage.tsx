"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, StatCard, Table, TableRow, statusBadge,
  Spinner, Empty, Select, Pagination, timeAgo, displayName,
} from "@/features/admin/components/AdminShell";

export function ReviewStatusPage() {
  const [reviews, setReviews]       = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]       = useState(true);
  const [status, setStatus]         = useState("");
  const [page, setPage]             = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    const params: any = { page };
    if (status) params.status = status;
    apiClient.get("/content/reviews", { params })
      .then((r) => {
        setReviews(r.data.data.reviews ?? []);
        setPagination(r.data.data.pagination ?? { total: 0, page: 1, pages: 1 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const byStatus = (s: string) => reviews.filter((r) => r.status === s).length;
  const overdueCount = reviews.filter(
    (r) => r.dueAt && new Date(r.dueAt) < new Date() && r.status === "PENDING"
  ).length;

  const workload = reviews.reduce<Record<string, number>>((acc, r) => {
    if (!r.reviewer) return acc;
    const name = displayName(r.reviewer) as string;
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader title="Review Status" subtitle="All content in review — workload per reviewer and overdue tracking" />

      {overdueCount > 0 && (
        <div style={{ padding: "10px 16px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#ef4444" }}>
          ⚠️ {overdueCount} overdue review{overdueCount !== 1 ? "s" : ""} — follow up with reviewers
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
        <StatCard label="Total"       value={pagination.total}   />
        <StatCard label="Pending"     value={byStatus("PENDING")}     accent="#f59e0b" />
        <StatCard label="In progress" value={byStatus("IN_PROGRESS")} accent="#3b82f6" />
        <StatCard label="Approved"    value={byStatus("APPROVED")}    accent="#22c55e" />
        <StatCard label="Rejected"    value={byStatus("REJECTED")}    accent="#ef4444" />
      </div>

      {Object.keys(workload).length > 0 && (
        <Card title="Workload by reviewer">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {Object.entries(workload).map(([name, count]) => (
              <div key={name} style={{ padding: "6px 12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-full)", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                {name} — <strong style={{ color: "var(--color-text-primary)" }}>{count}</strong>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div style={{ display: "flex", gap: "10px" }}>
        <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[
          { label: "All statuses",  value: "" },
          { label: "Pending",       value: "PENDING" },
          { label: "In progress",   value: "IN_PROGRESS" },
          { label: "Approved",      value: "APPROVED" },
          { label: "Rejected",      value: "REJECTED" },
        ]} />
      </div>

      <Card noPad>
        {loading ? <Spinner /> : reviews.length === 0 ? <Empty message="No reviews found" /> : (
          <Table headers={["Content", "Reviewer", "Assigned", "Due", "Completed", "Status"]}>
            {reviews.map((r) => {
              const overdue = r.dueAt && new Date(r.dueAt) < new Date() && r.status === "PENDING";
              return (
                <TableRow
                  key={r.id}
                  cols={[
                    <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
                      {r.career?.title ?? r.question?.questionText?.slice(0, 60) ?? "—"}
                    </span>,
                    displayName(r.reviewer),
                    timeAgo(r.assignedAt),
                    r.dueAt
                      ? <span style={{ color: overdue ? "#ef4444" : "var(--color-text-muted)", fontSize: "12px" }}>
                          {overdue ? "⚠️ " : ""}{new Date(r.dueAt).toLocaleDateString("en-ZA")}
                        </span>
                      : "—",
                    r.completedAt ? timeAgo(r.completedAt) : "—",
                    statusBadge(r.status),
                  ]}
                />
              );
            })}
          </Table>
        )}
        <Pagination page={page} pages={pagination.pages} onPage={setPage} />
      </Card>
    </div>
  );
}
