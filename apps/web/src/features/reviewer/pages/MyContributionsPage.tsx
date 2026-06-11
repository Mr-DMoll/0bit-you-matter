"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/client";
import {
  PageHeader, Card, StatCard, Table, TableRow, statusBadge, Badge,
  Spinner, Empty, Pagination, timeAgo,
} from "@/features/admin/components/AdminShell";

export function MyContributionsPage() {
  const router                      = useRouter();
  const [reviews, setReviews]       = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    // Fetch both APPROVED and REJECTED so the table and stats are complete
    Promise.all([
      apiClient.get("/content/reviews", { params: { page, status: "APPROVED", limit: 50 } }),
      apiClient.get("/content/reviews", { params: { page, status: "REJECTED", limit: 50 } }),
    ])
      .then(([approvedRes, rejectedRes]) => {
        const approvedRows  = approvedRes.data.data.reviews  ?? [];
        const rejectedRows  = rejectedRes.data.data.reviews  ?? [];
        const merged        = [...approvedRows, ...rejectedRows].sort(
          (a, b) => new Date(b.completedAt ?? b.createdAt).getTime() - new Date(a.completedAt ?? a.createdAt).getTime()
        );
        setReviews(merged);
        // Use APPROVED pagination total as the base (both sets combined is approximate)
        const total = (approvedRes.data.data.pagination?.total ?? 0) + (rejectedRes.data.data.pagination?.total ?? 0);
        setPagination({ total, page, pages: Math.ceil(total / 50) || 1 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const completed = reviews;
  const approved  = reviews.filter((r) => r.status === "APPROVED").length;
  const rejected  = reviews.filter((r) => r.status === "REJECTED").length;
  const approvalRate = completed.length ? Math.round((approved / completed.length) * 100) : 0;

  // Dynamic type filter — only shown when reviewer has reviewed more than 1 content type
  const distinctTypes = [...new Set(reviews.map((r) => r.contentType).filter(Boolean))];
  const showTypeFilter = distinctTypes.length > 1;
  const displayedReviews = typeFilter ? reviews.filter((r) => r.contentType === typeFilter) : reviews;

  // Colour map for type pills
  const TYPE_COLOURS: Record<string, string> = {
    CAREER:              "#6366f1",
    PATHWAY:             "#0ea5e9",
    BURSARY:             "#f59e0b",
    TVET_COLLEGE:        "#22c55e",
    ASSESSMENT_QUESTION: "#ec4899",
    UNIVERSITY_PROGRAMME:"#8b5cf6",
  };

  const avgConfidence = (() => {
    const scored = reviews.filter((r) => r.confidenceRating);
    if (!scored.length) return 0;
    return (scored.reduce((s, r) => s + r.confidenceRating, 0) / scored.length).toFixed(1);
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

      {/* Dynamic type filter — only rendered when reviewer has reviewed 2+ types */}
      {!loading && showTypeFilter && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", marginRight: 4 }}>Filter by type:</span>
          {/* "All" pill */}
          <button
            onClick={() => setTypeFilter("")}
            style={{
              padding: "5px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
              border: `1.5px solid ${!typeFilter ? "rgba(99,102,241,0.5)" : "var(--color-border)"}`,
              background: !typeFilter ? "rgba(99,102,241,0.1)" : "transparent",
              color: !typeFilter ? "#6366f1" : "var(--color-text-muted)",
            }}
          >
            All
          </button>
          {distinctTypes.map((type) => {
            const active = typeFilter === type;
            const col    = TYPE_COLOURS[type] ?? "#6366f1";
            const count  = reviews.filter((r) => r.contentType === type).length;
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(active ? "" : type)}
                style={{
                  padding: "5px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                  border: `1.5px solid ${active ? col + "80" : "var(--color-border)"}`,
                  background: active ? col + "18" : "transparent",
                  color: active ? col : "var(--color-text-muted)",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {type.replace(/_/g, " ")}
                <span style={{
                  fontSize: 11, fontWeight: 700, minWidth: 18, height: 18,
                  background: active ? col + "30" : "var(--color-bg-secondary)",
                  color: active ? col : "var(--color-text-muted)",
                  borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px",
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <Card noPad>
        {loading ? <Spinner /> : reviews.length === 0 ? <Empty message="No reviews submitted yet" /> : (
          <Table headers={["Content", "Type", "Decision", "Confidence", "Completed", "Notes", ""]}>
            {displayedReviews.map((r) => (
              <TableRow
                key={r.id}
                cols={[
                  <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
                    {r.career?.title ?? r.question?.questionText?.slice(0, 50) ?? r.tvetCollege?.name ?? r.bursary?.name ?? r.pathway?.title ?? "—"}
                  </span>,
                  <Badge label={r.contentType?.replace(/_/g, " ")} color="#6366f1" />,
                  statusBadge(r.status),
                  r.confidenceRating
                    ? <span style={{ fontSize: "13px", fontWeight: 600, color: "#6366f1" }}>{r.confidenceRating}/5</span>
                    : "—",
                  r.completedAt ? timeAgo(r.completedAt) : "—",
                  r.notes
                    ? <span style={{ fontSize: "12px", color: "var(--color-text-muted)", maxWidth: "200px", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.notes}
                      </span>
                    : "—",
                  <button
                    onClick={() => router.push(`/reviewer/review/${r.id}`)}
                    style={{ padding: "4px 12px", fontSize: "12px", fontWeight: 600, border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", background: "var(--color-bg-secondary)", color: "var(--color-text-muted)", cursor: "pointer" }}
                  >
                    Edit →
                  </button>,
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
