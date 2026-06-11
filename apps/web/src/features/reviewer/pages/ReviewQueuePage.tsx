"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/client";
import {
  PageHeader, Card, StatCard, Table, TableRow, statusBadge, Badge,
  Spinner, Empty, Select, Pagination, timeAgo,
} from "@/features/admin/components/AdminShell";

export function ReviewerQueuePage() {
  const router = useRouter();
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

  const pending  = reviews.filter((r) => r.status === "PENDING").length;
  const inProg   = reviews.filter((r) => r.status === "IN_PROGRESS").length;
  const verified = reviews.filter((r) => r.status === "APPROVED" || r.status === "VERIFIED").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader title="Review Queue" subtitle="AI-generated content assigned to you — review each item and verify or discard" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
        <StatCard label="Assigned"    value={pagination.total} />
        <StatCard label="Pending"     value={pending}  accent="#f59e0b" />
        <StatCard label="In progress" value={inProg}   accent="#3b82f6" />
        <StatCard label="Verified"    value={verified} accent="#22c55e" />
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[
          { label: "All statuses",  value: "" },
          { label: "Pending",       value: "PENDING" },
          { label: "In progress",   value: "IN_PROGRESS" },
          { label: "Verified",      value: "APPROVED" },
        ]} />
      </div>

      <Card noPad>
        {loading ? <Spinner /> : reviews.length === 0 ? <Empty message="Your review queue is empty" /> : (
          <Table headers={["Content", "Type", "Assigned", "Status", ""]}>
            {reviews.map((r) => (
              <TableRow
                key={r.id}
                cols={[
                  <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
                    {r.career?.title ?? r.question?.questionText?.slice(0, 60) ?? r.tvetCollege?.name ?? "—"}
                  </span>,
                  <Badge label={r.contentType} color="#6366f1" />,
                  timeAgo(r.createdAt),
                  statusBadge(r.status),
                  (r.status === "PENDING" || r.status === "IN_PROGRESS")
                    ? <button
                        onClick={() => router.push(`/reviewer/review/${r.id}`)}
                        style={{ padding: "4px 12px", background: "#6366f1", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}
                      >
                        Review →
                      </button>
                    : null,
                ]}
              />
            ))}
          </Table>
        )}
        <Pagination page={page} pages={pagination.pages} onPage={setPage} />
      </Card>
    </div>
  );
}
