"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, Table, TableRow, statusBadge,
  Spinner, Empty, SearchInput, Select, Pagination,
} from "../components/AdminShell";

export function AdminBursariesPage() {
  const [bursaries, setBursaries]   = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [status, setStatus]         = useState("");
  const [page, setPage]             = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    const params: any = { page };
    if (status) params.status = status;
    apiClient.get("/bursaries", { params })
      .then((r) => { setBursaries(r.data.data.bursaries); setPagination(r.data.data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? bursaries.filter((b) =>
        [b.name, b.provider].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())
      )
    : bursaries;

  const daysUntil = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    if (days < 0)  return <span style={{ color: "#ef4444", fontSize: "12px" }}>Expired</span>;
    if (days < 14) return <span style={{ color: "#f59e0b", fontSize: "12px" }}>{days}d left</span>;
    return <span style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>{days}d</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader title="Bursaries" subtitle={`${pagination.total} bursary records`} />

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or provider…" />
        <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[
          { label: "All statuses", value: "" },
          { label: "AI Generated", value: "AI_GENERATED" },
          { label: "In Review",    value: "IN_REVIEW" },
          { label: "Approved",     value: "APPROVED" },
          { label: "Verified",     value: "VERIFIED" },
        ]} />
      </div>

      <Card noPad>
        {loading ? <Spinner /> : filtered.length === 0 ? <Empty message="No bursaries found" /> : (
          <Table headers={["Name", "Provider", "Fields of study", "Amount", "Deadline", "Website", "Status"]}>
            {filtered.map((b) => {
              const isExpired = b.closeDate && new Date(b.closeDate) < new Date();
              return (
                <TableRow
                  key={b.id}
                  cols={[
                    <div>
                      <span style={{ fontWeight: 500, color: isExpired ? "var(--color-text-muted)" : "var(--color-text-primary)", textDecoration: isExpired ? "line-through" : "none" }}>{b.name}</span>
                      {isExpired && <span style={{ display: "block", fontSize: "11px", color: "#ef4444", fontWeight: 600, marginTop: "1px" }}>Expired — hidden from learners</span>}
                    </div>,
                    <span style={{ color: isExpired ? "var(--color-text-muted)" : undefined }}>{b.provider}</span>,
                    (b.fieldsOfStudy ?? []).slice(0, 2).join(", ") || "—",
                    b.amount
                      ? <span style={{ fontSize: "12px", color: "#22c55e", fontWeight: 600 }}>{b.amount}</span>
                      : <span style={{ color: "#f59e0b", fontSize: "12px" }}>Missing ⚠</span>,
                    b.closeDate ? daysUntil(b.closeDate) : <span style={{ color: "#f59e0b", fontSize: "12px" }}>No deadline ⚠</span>,
                    b.sourceUrl
                      ? <a href={b.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "var(--color-accent)", textDecoration: "none" }}>Visit ↗</a>
                      : <span style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>—</span>,
                    statusBadge(b.status),
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
