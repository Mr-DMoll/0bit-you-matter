"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, Table, TableRow, Badge,
  Spinner, Empty, Select, Pagination, timeAgo,
} from "@/features/admin/components/AdminShell";

export function FeedbackLoopPage() {
  const [reviews, setReviews]       = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [contentType, setContentType] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    apiClient.get("/content/reviews", { params: { page, status: "REJECTED" } })
      .then((r) => {
        setReviews(r.data.data.reviews ?? []);
        setPagination(r.data.data.pagination ?? { total: 0, page: 1, pages: 1 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const filtered = contentType
    ? reviews.filter((r) => r.contentType === contentType)
    : reviews;

  const themes = filtered.reduce<Record<string, number>>((acc, r) => {
    const notes: string = r.notes ?? "";
    const words = notes.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
    words.forEach((w) => { acc[w] = (acc[w] ?? 0) + 1; });
    return acc;
  }, {});

  const topThemes = Object.entries(themes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Feedback Loop"
        subtitle="Rejected content with reviewer notes — use this to refine prompt templates and reduce rejection rates"
      />

      {topThemes.length > 0 && (
        <Card title="Common themes in rejection notes">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {topThemes.map(([word, count]) => (
              <div key={word} style={{ padding: "4px 10px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "var(--radius-full)", fontSize: "12px", color: "#ef4444" }}>
                {word} ({count})
              </div>
            ))}
          </div>
          <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "10px" }}>
            Tip — update the prompt template for the most common themes to reduce future rejections.
          </p>
        </Card>
      )}

      <div style={{ display: "flex", gap: "10px" }}>
        <Select value={contentType} onChange={(v) => { setContentType(v); setPage(1); }} options={[
          { label: "All types",            value: "" },
          { label: "Career",               value: "CAREER" },
          { label: "University Programme", value: "UNIVERSITY_PROGRAMME" },
          { label: "Bursary",              value: "BURSARY" },
        ]} />
      </div>

      <Card noPad>
        {loading ? <Spinner /> : filtered.length === 0 ? <Empty message="No rejected content — looking good!" /> : (
          <Table headers={["Content", "Type", "Reviewer", "Rejected", "Notes"]}>
            {filtered.map((r) => (
              <TableRow
                key={r.id}
                cols={[
                  <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
                    {r.career?.title ?? r.question?.questionText?.slice(0, 60) ?? "—"}
                  </span>,
                  <Badge label={r.contentType} color="#ef4444" />,
                  r.reviewer
                    ? `${r.reviewer.firstName ?? ""} ${r.reviewer.lastName ?? ""}`.trim() || r.reviewer.email
                    : "—",
                  timeAgo(r.completedAt ?? r.updatedAt),
                  r.notes
                    ? <span style={{ fontSize: "12px", color: "var(--color-text-muted)", maxWidth: "300px", display: "block" }}>
                        "{r.notes}"
                      </span>
                    : <span style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>No notes</span>,
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
