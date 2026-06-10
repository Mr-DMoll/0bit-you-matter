"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/client";
import {
  PageHeader, Card, StatCard, Table, TableRow, statusBadge, Badge,
  Spinner, Empty, Select, Btn, Pagination, timeAgo,
} from "@/features/admin/components/AdminShell";

const deadlineFreshness = (deadline: string | null) => {
  if (!deadline) return { label: "No deadline", color: "#94a3b8" };
  const days = Math.floor((new Date(deadline).getTime() - Date.now()) / 86_400_000);
  if (days < 0)  return { label: "Expired",           color: "#ef4444" };
  if (days < 14) return { label: `${days}d left`,     color: "#f59e0b" };
  return             { label: `${days}d left`,         color: "#22c55e" };
};

export function DeadlineQueuePage() {
  const router = useRouter();
  const [verifications, setVerifications] = useState<any[]>([]);
  const [pagination, setPagination]       = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]             = useState(true);
  const [status, setStatus]               = useState("");
  const [page, setPage]                   = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    const params: any = { page, dataType: "BURSARY" };
    if (status) params.status = status;
    apiClient.get("/content/verifications", { params })
      .then((r) => {
        const items = (r.data.data.verifications ?? []).sort((a: any, b: any) => {
          const dA = a.bursary?.applicationDeadline ? new Date(a.bursary.applicationDeadline).getTime() : Infinity;
          const dB = b.bursary?.applicationDeadline ? new Date(b.bursary.applicationDeadline).getTime() : Infinity;
          return dA - dB;
        });
        setVerifications(items);
        setPagination(r.data.data.pagination ?? { total: 0, page: 1, pages: 1 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const expiredCount = verifications.filter(
    (v) => v.bursary?.applicationDeadline && new Date(v.bursary.applicationDeadline) < new Date()
  ).length;

  const urgentCount = verifications.filter((v) => {
    if (!v.bursary?.applicationDeadline) return false;
    const days = Math.floor((new Date(v.bursary.applicationDeadline).getTime() - Date.now()) / 86_400_000);
    return days >= 0 && days < 14;
  }).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Deadline Queue"
        subtitle="Verify bursary application deadlines — sorted by nearest deadline first"
      />

      {expiredCount > 0 && (
        <div style={{ padding: "10px 16px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#ef4444" }}>
          ⚠️ {expiredCount} expired deadline{expiredCount !== 1 ? "s" : ""} — verify and update or archive these bursaries
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
        <StatCard label="Total"    value={pagination.total} />
        <StatCard label="Expired"  value={expiredCount}  accent="#ef4444" />
        <StatCard label="< 14 days" value={urgentCount}  accent="#f59e0b" />
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[
          { label: "All statuses", value: "" },
          { label: "Pending",      value: "PENDING" },
          { label: "In progress",  value: "IN_PROGRESS" },
          { label: "Verified",     value: "VERIFIED" },
          { label: "Rejected",     value: "REJECTED" },
        ]} />
      </div>

      <Card noPad>
        {loading ? <Spinner /> : verifications.length === 0 ? <Empty message="No deadline verifications in the queue" /> : (
          <Table headers={["Bursary", "Provider", "Deadline", "Amount", "Status", ""]}>
            {verifications.map((v) => {
              const { label, color } = deadlineFreshness(v.bursary?.applicationDeadline ?? null);
              return (
                <TableRow
                  key={v.id}
                  cols={[
                    <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{v.bursary?.name ?? "—"}</span>,
                    v.bursary?.provider ?? "—",
                    <Badge label={label} color={color} />,
                    v.bursary?.amount ? `R${Number(v.bursary.amount).toLocaleString()}` : "—",
                    statusBadge(v.status),
                    (v.status === "PENDING" || v.status === "IN_PROGRESS")
                      ? <Btn label="Verify →" onClick={() => router.push(`/data-verifier/verify/${v.id}`)} small />
                      : null,
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
