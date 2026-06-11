"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, StatCard, Table, TableRow, statusBadge, Badge,
  Spinner, Empty, Select, Btn, Pagination, timeAgo, displayName,
} from "@/features/admin/components/AdminShell";

export function VerificationQueuePage() {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [verifiers, setVerifiers]         = useState<any[]>([]);
  const [pagination, setPagination]       = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]             = useState(true);
  const [status, setStatus]               = useState("");
  const [page, setPage]                   = useState(1);
  const [assigning, setAssigning]         = useState<string | null>(null);
  const [selected, setSelected]           = useState<Record<string, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    const params: any = { page };
    if (status) params.status = status;
    Promise.all([
      apiClient.get("/content/verifications", { params }),
      apiClient.get("/admin/staff", { params: { role: "REVIEWER" } }),
    ])
      .then(([vRes, uRes]) => {
        setVerifications(vRes.data.data.verifications ?? []);
        setPagination(vRes.data.data.pagination ?? { total: 0, page: 1, pages: 1 });
        setVerifiers(uRes.data.data.users ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const verifierOptions = [
    { label: "Select verifier…", value: "" },
    ...verifiers.map((v) => ({
      label: `${v.firstName ?? ""} ${v.lastName ?? ""}`.trim() || v.email,
      value: v.id,
    })),
  ];

  const assign = async (verificationId: string) => {
    const verifierId = selected[verificationId];
    if (!verifierId) return;
    setAssigning(verificationId);
    try {
      await apiClient.patch(`/content/verifications/${verificationId}/assign`, { verifierId });
      load();
    } catch {}
    finally { setAssigning(null); }
  };

  const byStatus = (s: string) => verifications.filter((v) => v.status === s).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Verification Queue"
        subtitle="Reviewed content awaiting Data Verifier sign-off before going live"
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
        <StatCard label="Total"     value={pagination.total}       />
        <StatCard label="Pending"   value={byStatus("PENDING")}   accent="#f59e0b" />
        <StatCard label="Verified"  value={byStatus("VERIFIED")}  accent="#22c55e" />
        <StatCard label="Rejected"  value={byStatus("REJECTED")}  accent="#ef4444" />
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
        {loading ? <Spinner /> : verifications.length === 0 ? <Empty message="No items in the verification queue" /> : (
          <Table headers={["Content", "Type", "Reviewer", "Verifier", "Queued", "Status", "Assign"]}>
            {verifications.map((v) => (
              <TableRow
                key={v.id}
                cols={[
                  <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
                    {v.career?.title ?? v.university?.name ?? v.bursary?.name ?? "—"}
                  </span>,
                  <Badge label={v.dataType} color="#8b5cf6" />,
                  v.assignedBy ? displayName(v.assignedBy) : "—",
                  v.verifier   ? displayName(v.verifier)   : <span style={{ color: "#f59e0b", fontSize: "12px" }}>Unassigned</span>,
                  timeAgo(v.createdAt),
                  statusBadge(v.status),
                  v.status === "PENDING" ? (
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <div style={{ minWidth: "160px" }}>
                        <Select
                          value={selected[v.id] ?? ""}
                          onChange={(val) => setSelected((prev) => ({ ...prev, [v.id]: val }))}
                          options={verifierOptions}
                        />
                      </div>
                      <Btn label={assigning === v.id ? "…" : "Assign"} onClick={() => assign(v.id)} small />
                    </div>
                  ) : "—",
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
