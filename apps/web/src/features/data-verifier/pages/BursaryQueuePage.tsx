"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/client";
import {
  PageHeader, Card, StatCard, Table, TableRow, statusBadge, Badge,
  Spinner, Empty, Select, Btn, Pagination, SearchInput, timeAgo,
} from "@/features/admin/components/AdminShell";

export function BursaryQueuePage() {
  const router = useRouter();
  const [verifications, setVerifications] = useState<any[]>([]);
  const [pagination, setPagination]       = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]             = useState(true);
  const [status, setStatus]               = useState("");
  const [search, setSearch]               = useState("");
  const [page, setPage]                   = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    const params: any = { page, dataType: "BURSARY" };
    if (status) params.status = status;
    apiClient.get("/content/verifications", { params })
      .then((r) => {
        setVerifications(r.data.data.verifications ?? []);
        setPagination(r.data.data.pagination ?? { total: 0, page: 1, pages: 1 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? verifications.filter((v) => v.bursary?.name?.toLowerCase().includes(search.toLowerCase()))
    : verifications;

  const pending  = verifications.filter((v) => v.status === "PENDING").length;
  const verified = verifications.filter((v) => v.status === "VERIFIED").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Bursary Queue"
        subtitle="Verify bursary amounts, application links and eligibility criteria against provider websites"
      />

      <Card title="What to check">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {[
            { icon: "💰", label: "Amount",     desc: "Confirm bursary amount matches the provider's current offer" },
            { icon: "📅", label: "Deadline",   desc: "Confirm application deadline is current and not expired" },
            { icon: "🔗", label: "Link",       desc: "Test the application URL — confirm it goes to the actual bursary page" },
            { icon: "📋", label: "Eligibility", desc: "Check that subject, citizenship and income requirements are accurate" },
          ].map(({ icon, label, desc }) => (
            <div key={label} style={{ display: "flex", gap: "10px", padding: "10px", background: "var(--color-bg-secondary)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
              <span style={{ fontSize: "18px", flexShrink: 0 }}>{icon}</span>
              <div>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{label}</p>
                <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
        <StatCard label="Total"    value={pagination.total} />
        <StatCard label="Pending"  value={pending}  accent="#f59e0b" />
        <StatCard label="Verified" value={verified} accent="#22c55e" />
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search bursaries…" />
        <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[
          { label: "All statuses", value: "" },
          { label: "Pending",      value: "PENDING" },
          { label: "In progress",  value: "IN_PROGRESS" },
          { label: "Verified",     value: "VERIFIED" },
          { label: "Rejected",     value: "REJECTED" },
        ]} />
      </div>

      <Card noPad>
        {loading ? <Spinner /> : filtered.length === 0 ? <Empty message="No bursary verifications found" /> : (
          <Table headers={["Bursary", "Provider", "Amount", "Sector", "Queued", "Status", ""]}>
            {filtered.map((v) => (
              <TableRow
                key={v.id}
                cols={[
                  <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{v.bursary?.name ?? "—"}</span>,
                  v.bursary?.provider ?? "—",
                  v.bursary?.amount ? `R${Number(v.bursary.amount).toLocaleString()}` : "—",
                  v.bursary?.sector
                    ? <Badge label={v.bursary.sector} color="#8b5cf6" />
                    : "—",
                  timeAgo(v.createdAt),
                  statusBadge(v.status),
                  (v.status === "PENDING" || v.status === "IN_PROGRESS")
                    ? <Btn label="Verify →" onClick={() => router.push(`/data-verifier/verify/${v.id}`)} small />
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
