"use client";

import { useState, useEffect } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, Table, TableRow, Badge,
  Spinner, Empty, Select, SearchInput, timeAgo,
} from "@/features/admin/components/AdminShell";

const RELIABILITY_COLOR: Record<string, string> = {
  HIGH: "#22c55e", MEDIUM: "#f59e0b", LOW: "#ef4444",
};

export function DVSourceLibraryPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("");

  useEffect(() => {
    apiClient.get("/content/sources")
      .then((r) => setSources(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = sources.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = !filter || s.reliability === filter;
    return matchSearch && matchFilter;
  });

  const highCount   = sources.filter((s) => s.reliability === "HIGH").length;
  const mediumCount = sources.filter((s) => s.reliability === "MEDIUM").length;
  const lowCount    = sources.filter((s) => s.reliability === "LOW").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Source Library"
        subtitle="Reference sources for verification — use these when cross-checking APS, deadlines and bursary details"
      />

      <Card title="Source coverage">
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {[
            { label: "High reliability", count: highCount,   color: "#22c55e" },
            { label: "Medium",           count: mediumCount, color: "#f59e0b" },
            { label: "Low",              count: lowCount,    color: "#ef4444" },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }} />
              <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{label}: <strong style={{ color: "var(--color-text-primary)" }}>{count}</strong></span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="How to use this list">
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            "Prefer HIGH reliability sources when verifying APS scores — SAQA, university prospectuses.",
            "For bursary deadlines, always go to the original provider website — never trust third-party aggregators.",
            "Mark sources as LOW if their data is often out of date — flag to the Content Manager to remove.",
            "If a correct source is missing, request it from the Content Manager via the feedback notes.",
          ].map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: "10px" }}>
              <span style={{ color: "#6366f1", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
              <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{tip}</span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "flex", gap: "10px" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search sources…" />
        <Select value={filter} onChange={setFilter} options={[
          { label: "All reliability", value: "" },
          { label: "High",            value: "HIGH" },
          { label: "Medium",          value: "MEDIUM" },
          { label: "Low",             value: "LOW" },
        ]} />
      </div>

      <Card noPad>
        {loading ? <Spinner /> : filtered.length === 0 ? <Empty message="No sources found" /> : (
          <Table headers={["Name", "Type", "Reliability", "URL", "Updated"]}>
            {filtered.map((s) => (
              <TableRow
                key={s.id}
                cols={[
                  <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{s.name}</span>,
                  s.sourceType ?? "—",
                  <Badge label={s.reliability} color={RELIABILITY_COLOR[s.reliability] ?? "#94a3b8"} />,
                  <a href={s.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: "12px", color: "#6366f1", textDecoration: "none", maxWidth: "200px", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.url}
                  </a>,
                  timeAgo(s.updatedAt),
                ]}
              />
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
