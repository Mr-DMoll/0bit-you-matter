"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, Table, TableRow, statusBadge, Badge,
  Spinner, Empty, Select, Btn, Pagination, timeAgo,
} from "@/features/admin/components/AdminShell";

export function AssignReviewsPage() {
  const [careers, setCareers]       = useState<any[]>([]);
  const [reviewers, setReviewers]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [page, setPage]             = useState(1);
  const [assigning, setAssigning]   = useState<string | null>(null);
  const [selected, setSelected]     = useState<Record<string, string>>({}); // careerId → reviewerId

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiClient.get("/careers", { params: { status: "AI_GENERATED", page } }),
      apiClient.get("/admin/staff", { params: { role: "REVIEWER" } }),
    ])
      .then(([cRes, rRes]) => {
        setCareers(cRes.data.data.careers ?? cRes.data.data);
        setPagination(cRes.data.data.pagination ?? { total: 0, page: 1, pages: 1 });
        setReviewers(rRes.data.data.users ?? rRes.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const reviewerOptions = [
    { label: "Select reviewer…", value: "" },
    ...reviewers.map((r) => ({
      label: `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || r.email,
      value: r.id,
    })),
  ];

  const assign = async (careerId: string) => {
    const reviewerId = selected[careerId];
    if (!reviewerId) return;
    setAssigning(careerId);
    try {
      await apiClient.post("/content/reviews", { careerId, reviewerId });
      load();
    } catch {}
    finally { setAssigning(null); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Assign Reviews"
        subtitle="Route AI-generated content to Professional Reviewers before it reaches learners"
      />

      <Card noPad>
        {loading ? <Spinner /> : careers.length === 0 ? (
          <Empty message="No AI-generated content awaiting assignment" />
        ) : (
          <Table headers={["Title", "Cluster", "Status", "Generated", "Assign to reviewer", ""]}>
            {careers.map((c) => (
              <TableRow
                key={c.id}
                cols={[
                  <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{c.title}</span>,
                  <Badge label={c.careerCluster?.name ?? "—"} color="#6366f1" />,
                  statusBadge(c.status),
                  timeAgo(c.createdAt),
                  <div style={{ minWidth: "200px" }}>
                    <Select
                      value={selected[c.id] ?? ""}
                      onChange={(v) => setSelected((prev) => ({ ...prev, [c.id]: v }))}
                      options={reviewerOptions}
                    />
                  </div>,
                  <Btn
                    label={assigning === c.id ? "…" : "Assign"}
                    onClick={() => assign(c.id)}
                    small
                  />,
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
