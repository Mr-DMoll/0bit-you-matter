"use client";

import { useState, useEffect } from "react";
import apiClient from "@/api/client";
import { PageHeader, Card, StatCard, Table, TableRow, Badge, Spinner, Empty, timeAgo } from "@/features/admin/components/AdminShell";

type FreshnessRow = {
  id: string;
  title: string;
  dataType: string;
  lastVerifiedAt: string | null;
  status: string;
  daysSince: number | null;
};

const THRESHOLDS: Record<string, number> = {
  CAREER:               365,
  UNIVERSITY_PROGRAMME: 365,
  BURSARY:              180,
};

const freshnessColor = (days: number | null, type: string): string => {
  if (days === null) return "#ef4444";
  const threshold = THRESHOLDS[type] ?? 365;
  if (days > threshold)        return "#ef4444";
  if (days > threshold * 0.75) return "#f59e0b";
  return "#22c55e";
};

const freshnessLabel = (days: number | null, type: string): string => {
  if (days === null) return "Never verified";
  const threshold = THRESHOLDS[type] ?? 365;
  if (days > threshold)        return "Stale";
  if (days > threshold * 0.75) return "Aging";
  return "Fresh";
};

export function FreshnessDashboardPage() {
  const [rows, setRows]       = useState<FreshnessRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get("/careers",        { params: { page: 1 } }),
      apiClient.get("/universities",   { params: { page: 1 } }),
      apiClient.get("/bursaries",      { params: { page: 1 } }),
    ])
      .then(([cRes, uRes, bRes]) => {
        const now = Date.now();
        const toRow = (item: any, dataType: string): FreshnessRow => {
          const lastVerified = item.lastVerifiedAt ? new Date(item.lastVerifiedAt).getTime() : null;
          const daysSince    = lastVerified ? Math.floor((now - lastVerified) / 86_400_000) : null;
          return {
            id: item.id,
            title: item.title ?? item.name ?? "—",
            dataType,
            lastVerifiedAt: item.lastVerifiedAt ?? null,
            status: item.status,
            daysSince,
          };
        };
        const careers  = (cRes.data.data.careers ?? cRes.data.data ?? []).map((c: any) => toRow(c, "CAREER"));
        const unis     = (uRes.data.data.universities ?? uRes.data.data ?? []).map((u: any) => toRow(u, "UNIVERSITY_PROGRAMME"));
        const bursaries= (bRes.data.data.bursaries ?? bRes.data.data ?? []).map((b: any) => toRow(b, "BURSARY"));
        setRows([...careers, ...unis, ...bursaries].sort((a, b) => {
          if (a.daysSince === null) return -1;
          if (b.daysSince === null) return 1;
          return b.daysSince - a.daysSince;
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stale  = rows.filter((r) => freshnessLabel(r.daysSince, r.dataType) === "Stale").length;
  const aging  = rows.filter((r) => freshnessLabel(r.daysSince, r.dataType) === "Aging").length;
  const fresh  = rows.filter((r) => freshnessLabel(r.daysSince, r.dataType) === "Fresh").length;
  const neverV = rows.filter((r) => r.daysSince === null).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Freshness Dashboard"
        subtitle="Database freshness by data type — stale entries should be queued for regeneration or re-verification"
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
        <StatCard label="Total entries"   value={rows.length}   />
        <StatCard label="Stale"           value={stale}         accent="#ef4444" />
        <StatCard label="Aging"           value={aging}         accent="#f59e0b" />
        <StatCard label="Fresh"           value={fresh}         accent="#22c55e" />
        <StatCard label="Never verified"  value={neverV}        accent="#6366f1" />
      </div>

      <Card title="Freshness thresholds">
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {Object.entries(THRESHOLDS).map(([type, days]) => (
            <div key={type} style={{ padding: "8px 14px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "12px" }}>
              <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{type.replace("_", " ")}</span>
              <span style={{ color: "var(--color-text-muted)" }}> — {days} days</span>
            </div>
          ))}
        </div>
      </Card>

      {loading ? <Spinner /> : rows.length === 0 ? <Empty message="No entries found" /> : (
        <Card title="All entries (stalest first)" noPad>
          <Table headers={["Title", "Type", "Last verified", "Days since", "Freshness"]}>
            {rows.slice(0, 50).map((r) => {
              const color = freshnessColor(r.daysSince, r.dataType);
              const label = freshnessLabel(r.daysSince, r.dataType);
              return (
                <TableRow
                  key={r.id}
                  cols={[
                    <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{r.title}</span>,
                    r.dataType,
                    r.lastVerifiedAt ? timeAgo(r.lastVerifiedAt) : <span style={{ color: "#ef4444", fontSize: "12px" }}>Never</span>,
                    r.daysSince !== null
                      ? <span style={{ color, fontWeight: 600 }}>{r.daysSince}d</span>
                      : "—",
                    <Badge label={label} color={color} />,
                  ]}
                />
              );
            })}
          </Table>
        </Card>
      )}
    </div>
  );
}
