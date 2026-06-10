"use client";

import { useState, useEffect } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, StatCard, Table, TableRow, statusBadge, Badge,
  Spinner, Empty, Pagination, timeAgo,
} from "@/features/admin/components/AdminShell";

export function MyContributionsPage() {
  const [reviews, setReviews]       = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);

  useEffect(() => {
    setLoading(true);
    apiClient.get("/content/reviews", { params: { page } })
      .then((r) => {
        setReviews(r.data.data.reviews ?? []);
        setPagination(r.data.data.pagination ?? { total: 0, page: 1, pages: 1 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const completed = reviews.filter((r) => r.status === "APPROVED" || r.status === "REJECTED");
  const approved  = completed.filter((r) => r.status === "APPROVED").length;
  const rejected  = completed.filter((r) => r.status === "REJECTED").length;
  const approvalRate = completed.length ? Math.round((approved / completed.length) * 100) : 0;

  const avgConfidence = (() => {
    const scored = reviews.filter((r) => r.confidenceScore);
    if (!scored.length) return 0;
    return (scored.reduce((s, r) => s + r.confidenceScore, 0) / scored.length).toFixed(1);
  })();

  const avgTurnaround = (() => {
    const done = reviews.filter((r) => r.completedAt && r.assignedAt);
    if (!done.length) return 0;
    const totalHours = done.reduce((s, r) => {
      return s + (new Date(r.completedAt).getTime() - new Date(r.assignedAt).getTime()) / 3_600_000;
    }, 0);
    return Math.round(totalHours / done.length);
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader title="My Contributions" subtitle="Your review history, approval rate and confidence scores" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
        <StatCard label="Total reviewed"  value={pagination.total}          />
        <StatCard label="Approved"        value={approved}                  accent="#22c55e" />
        <StatCard label="Rejected"        value={rejected}                  accent="#ef4444" />
        <StatCard label="Approval rate"   value={`${approvalRate}%`}        accent={approvalRate >= 70 ? "#22c55e" : "#f59e0b"} />
        <StatCard label="Avg confidence"  value={`${avgConfidence}/5`}      accent="#6366f1" />
        <StatCard label="Avg turnaround"  value={`${avgTurnaround}h`}       accent="#8b5cf6" />
      </div>

      {completed.length > 0 && (
        <Card title="Performance over time">
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ flex: 1, height: "20px", background: "var(--color-bg-secondary)", borderRadius: "var(--radius-full)", overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${approvalRate}%`, background: "#22c55e", transition: "width 0.5s ease" }} />
              <div style={{ width: `${100 - approvalRate}%`, background: "rgba(239,68,68,0.3)" }} />
            </div>
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)", flexShrink: 0 }}>{approvalRate}% approved</span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "8px" }}>
            Platform target: 70%+. {approvalRate >= 70 ? "You're on track — great work!" : "Consider attending a reviewer calibration session."}
          </p>
        </Card>
      )}

      <Card noPad>
        {loading ? <Spinner /> : reviews.length === 0 ? <Empty message="No reviews submitted yet" /> : (
          <Table headers={["Content", "Type", "Decision", "Confidence", "Completed", "Notes"]}>
            {reviews.map((r) => (
              <TableRow
                key={r.id}
                cols={[
                  <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
                    {r.career?.title ?? r.question?.questionText?.slice(0, 50) ?? "—"}
                  </span>,
                  <Badge label={r.contentType} color="#6366f1" />,
                  statusBadge(r.status),
                  r.confidenceScore
                    ? <span style={{ fontSize: "13px", fontWeight: 600, color: "#6366f1" }}>{r.confidenceScore}/5</span>
                    : "—",
                  r.completedAt ? timeAgo(r.completedAt) : "—",
                  r.notes
                    ? <span style={{ fontSize: "12px", color: "var(--color-text-muted)", maxWidth: "200px", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.notes}
                      </span>
                    : "—",
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
