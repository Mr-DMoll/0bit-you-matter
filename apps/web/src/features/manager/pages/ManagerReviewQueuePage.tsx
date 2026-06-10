"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, Table, TableRow, statusBadge,
  Spinner, Empty, Select, Pagination, timeAgo, displayName,
} from "@/features/admin/components/AdminShell";

export function ManagerReviewQueuePage() {
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
      .then((r) => { setReviews(r.data.data.reviews); setPagination(r.data.data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const overdueCount = reviews.filter(
    (r) => r.dueAt && new Date(r.dueAt) < new Date() && r.status === "PENDING"
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Review Queue"
        subtitle="Content items in review — track status and follow up on overdue items"
      />

      {overdueCount > 0 && (
        <div style={{ padding: "10px 16px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#ef4444" }}>
          ⚠️ {overdueCount} overdue review{overdueCount > 1 ? "s" : ""} — follow up with the reviewer
        </div>
      )}

      <div style={{ display: "flex", gap: "10px" }}>
        <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[
          { label: "All statuses", value: "" },
          { label: "Pending",      value: "PENDING" },
          { label: "In Progress",  value: "IN_PROGRESS" },
          { label: "Approved",     value: "APPROVED" },
          { label: "Rejected",     value: "REJECTED" },
        ]} />
      </div>

      <Card noPad>
        {loading ? <Spinner /> : reviews.length === 0 ? <Empty message="No reviews in the queue" /> : (
          <Table headers={["Content", "Type", "Reviewer", "Assigned", "Due", "Status"]}>
            {reviews.map((r) => {
              const overdue = r.dueAt && new Date(r.dueAt) < new Date() && r.status === "PENDING";
              return (
                <TableRow
                  key={r.id}
                  cols={[
                    <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
                      {r.career?.title ?? r.question?.questionText?.slice(0, 60) ?? "—"}
                    </span>,
                    r.contentType,
                    displayName(r.reviewer),
                    timeAgo(r.assignedAt),
                    r.dueAt
                      ? <span style={{ color: overdue ? "#ef4444" : "var(--color-text-muted)", fontSize: "12px" }}>
                          {overdue ? "⚠️ " : ""}{new Date(r.dueAt).toLocaleDateString("en-ZA")}
                        </span>
                      : "—",
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
