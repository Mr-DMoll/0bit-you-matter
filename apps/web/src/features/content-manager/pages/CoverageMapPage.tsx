"use client";

import { useState, useEffect } from "react";
import apiClient from "@/api/client";
import { PageHeader, Card, StatCard, Spinner } from "@/features/admin/components/AdminShell";

type ClusterStat = {
  clusterId: string;
  clusterName: string;
  total: number;
  verified: number;
  ai_generated: number;
  in_review: number;
};

const PCT_COLOR = (pct: number) =>
  pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";

export function CoverageMapPage() {
  const [stats, setStats]   = useState<ClusterStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/careers/stats/coverage")
      .then((r) => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalCareers   = stats.reduce((s, c) => s + c.total, 0);
  const totalVerified  = stats.reduce((s, c) => s + c.verified, 0);
  const totalInReview  = stats.reduce((s, c) => s + c.in_review, 0);
  const overallPct     = totalCareers ? Math.round((totalVerified / totalCareers) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Coverage Map"
        subtitle="Career entry coverage per cluster — spot gaps before learners hit dead ends"
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
        <StatCard label="Total careers"    value={totalCareers}  />
        <StatCard label="Verified"         value={totalVerified} accent="#22c55e" />
        <StatCard label="In review"        value={totalInReview} accent="#f59e0b" />
        <StatCard label="Overall coverage" value={`${overallPct}%`} accent={PCT_COLOR(overallPct)} />
      </div>

      {loading ? <Spinner /> : (
        <Card title="Cluster coverage">
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {stats
              .slice()
              .sort((a, b) => {
                const pctA = a.total ? a.verified / a.total : 0;
                const pctB = b.total ? b.verified / b.total : 0;
                return pctA - pctB;
              })
              .map((c) => {
                const pct = c.total ? Math.round((c.verified / c.total) * 100) : 0;
                const color = PCT_COLOR(pct);
                return (
                  <div key={c.clusterId}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)" }}>{c.clusterName}</span>
                      <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--color-text-muted)" }}>
                        <span style={{ color }}>{pct}% verified</span>
                        <span>{c.total} total</span>
                        <span style={{ color: "#f59e0b" }}>{c.in_review} in review</span>
                        <span style={{ color: "#6366f1" }}>{c.ai_generated} AI-generated</span>
                      </div>
                    </div>
                    <div style={{ height: "8px", background: "var(--color-bg-secondary)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "4px", transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      <Card title="Coverage legend">
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {[
            { color: "#22c55e", label: "≥ 80% verified — full coverage" },
            { color: "#f59e0b", label: "50–79% — partial coverage" },
            { color: "#ef4444", label: "< 50% — needs content generation" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "2px", background: color }} />
              <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
