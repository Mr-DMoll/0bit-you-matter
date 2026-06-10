"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/client";
import {
  PageHeader, Card, StatCard, Table, TableRow, statusBadge, Badge,
  Spinner, Empty, Select, Btn, Pagination, timeAgo,
} from "@/features/admin/components/AdminShell";

export function APSQueuePage() {
  const router = useRouter();
  const [verifications, setVerifications] = useState<any[]>([]);
  const [pagination, setPagination]       = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]             = useState(true);
  const [status, setStatus]               = useState("");
  const [page, setPage]                   = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    const params: any = { page, dataType: "UNIVERSITY_PROGRAMME" };
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

  const pending  = verifications.filter((v) => v.status === "PENDING").length;
  const verified = verifications.filter((v) => v.status === "VERIFIED").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="APS Queue"
        subtitle="Verify APS scores and subject requirements for university programmes — highest priority queue"
      />

      <div style={{ padding: "12px 16px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#6366f1" }}>
        🎯 Priority: APS data affects learner career planning directly. Incorrect scores send learners to programmes they don't qualify for.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
        <StatCard label="In queue"  value={pagination.total} />
        <StatCard label="Pending"   value={pending}  accent="#f59e0b" />
        <StatCard label="Verified"  value={verified} accent="#22c55e" />
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
        {loading ? <Spinner /> : verifications.length === 0 ? <Empty message="No APS verifications in the queue" /> : (
          <Table headers={["Programme", "University", "APS value", "Queued", "Status", ""]}>
            {verifications.map((v) => (
              <TableRow
                key={v.id}
                cols={[
                  <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
                    {v.universityProgramme?.name ?? v.university?.name ?? "—"}
                  </span>,
                  v.university?.name ?? "—",
                  v.universityProgramme?.apsRequired
                    ? <Badge label={`APS ${v.universityProgramme.apsRequired}`} color="#6366f1" />
                    : <span style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>Not set</span>,
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
