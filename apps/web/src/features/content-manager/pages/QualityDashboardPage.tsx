"use client";

import { useState, useEffect } from "react";
import apiClient from "@/api/client";
import { PageHeader, Card, StatCard, Table, TableRow, Spinner, Empty, Badge } from "@/features/admin/components/AdminShell";

export function QualityDashboardPage() {
  const [reviews, setReviews]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    apiClient.get("/content/reviews", { params: { page: 1 } })
      .then((r) => setReviews(r.data.data.reviews ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total     = reviews.length;
  const approved  = reviews.filter((r) => r.status === "APPROVED").length;
  const rejected  = reviews.filter((r) => r.status === "REJECTED").length;
  const approvalRate  = total ? Math.round((approved / total) * 100) : 0;
  const rejectionRate = total ? Math.round((rejected / total) * 100) : 0;

  const avgTurnaround = (() => {
    const completed = reviews.filter((r) => r.completedAt && r.assignedAt);
    if (!completed.length) return 0;
    const totalHours = completed.reduce((s, r) => {
      const ms = new Date(r.completedAt).getTime() - new Date(r.assignedAt).getTime();
      return s + ms / 3_600_000;
    }, 0);
    return Math.round(totalHours / completed.length);
  })();

  const byReviewer = reviews.reduce<Record<string, { name: string; total: number; approved: number; rejected: number }>>((acc, r) => {
    if (!r.reviewer) return acc;
    const id   = r.reviewer.id;
    const name = `${r.reviewer.firstName ?? ""} ${r.reviewer.lastName ?? ""}`.trim() || r.reviewer.email;
    if (!acc[id]) acc[id] = { name, total: 0, approved: 0, rejected: 0 };
    acc[id].total++;
    if (r.status === "APPROVED") acc[id].approved++;
    if (r.status === "REJECTED") acc[id].rejected++;
    return acc;
  }, {});

  const reviewerRows = Object.values(byReviewer).sort((a, b) => b.total - a.total);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Quality Dashboard"
        subtitle="Reviewer performance — approval rates, rejection rates and turnaround times"
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
        <StatCard label="Total reviewed"  value={total}          />
        <StatCard label="Approved"        value={approved}       accent="#22c55e" />
        <StatCard label="Rejected"        value={rejected}       accent="#ef4444" />
        <StatCard label="Approval rate"   value={`${approvalRate}%`}  accent={approvalRate >= 70 ? "#22c55e" : "#f59e0b"} />
        <StatCard label="Avg turnaround"  value={`${avgTurnaround}h`} accent="#6366f1" />
      </div>

      {loading ? <Spinner /> : reviewerRows.length === 0 ? <Empty message="No review data yet" /> : (
        <Card title="Reviewer performance" noPad>
          <Table headers={["Reviewer", "Total", "Approved", "Rejected", "Approval rate"]}>
            {reviewerRows.map((row) => {
              const rate = row.total ? Math.round((row.approved / row.total) * 100) : 0;
              return (
                <TableRow
                  key={row.name}
                  cols={[
                    <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{row.name}</span>,
                    row.total,
                    <span style={{ color: "#22c55e", fontWeight: 500 }}>{row.approved}</span>,
                    <span style={{ color: "#ef4444", fontWeight: 500 }}>{row.rejected}</span>,
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "60px", height: "6px", background: "var(--color-bg-secondary)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${rate}%`, background: rate >= 70 ? "#22c55e" : "#f59e0b", borderRadius: "3px" }} />
                      </div>
                      <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{rate}%</span>
                    </div>,
                  ]}
                />
              );
            })}
          </Table>
        </Card>
      )}

      <Card title="What impacts quality">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {[
            { title: "Improve prompt templates",  desc: "Tune prompts based on the Feedback Loop page — each rejection tells you exactly what the AI is getting wrong." },
            { title: "Source quality",             desc: "Only use HIGH reliability sources. LOW reliability sources produce factually weak content that reviewers will reject." },
            { title: "Parameter specificity",      desc: "The more context you provide in generation parameters, the less the AI has to infer — and the fewer inaccuracies." },
            { title: "Reviewer calibration",       desc: "If approval rates differ significantly between reviewers, run a calibration session to align on quality standards." },
          ].map(({ title, desc }) => (
            <div key={title} style={{ padding: "14px", background: "var(--color-bg-secondary)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "4px" }}>{title}</p>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
