"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, Table, TableRow, statusBadge,
  Spinner, Empty, Select, Btn, Pagination, timeAgo,
} from "@/features/admin/components/AdminShell";

export function GenerationQueuePage() {
  const [jobs, setJobs]             = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]       = useState(true);
  const [status, setStatus]         = useState("");
  const [page, setPage]             = useState(1);
  const [retrying, setRetrying]     = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params: any = { page };
    if (status) params.status = status;
    apiClient.get("/content/jobs", { params })
      .then((r) => { setJobs(r.data.data.jobs ?? []); setPagination(r.data.data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const retry = async (id: string) => {
    setRetrying(id);
    try { await apiClient.post(`/content/jobs/${id}/retry`); load(); }
    catch {}
    finally { setRetrying(null); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Generation Queue"
        subtitle="Live status of all AI content generation jobs"
        action={<Btn label="Refresh" onClick={load} variant="ghost" small />}
      />

      <div style={{ display: "flex", gap: "10px" }}>
        <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[
          { label: "All statuses", value: "" },
          { label: "Queued",       value: "QUEUED" },
          { label: "Processing",   value: "PROCESSING" },
          { label: "Completed",    value: "COMPLETED" },
          { label: "Failed",       value: "FAILED" },
        ]} />
      </div>

      <Card noPad>
        {loading ? <Spinner /> : jobs.length === 0 ? <Empty message="No generation jobs found" /> : (
          <Table headers={["Type", "Template", "Parameters", "Started", "Completed", "Status", ""]}>
            {jobs.map((j) => (
              <TableRow
                key={j.id}
                cols={[
                  <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{j.contentType}</span>,
                  j.promptTemplate?.name ?? <span style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>—</span>,
                  j.parameters
                    ? <span style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--color-text-muted)", maxWidth: "180px", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {JSON.stringify(j.parameters)}
                      </span>
                    : "—",
                  timeAgo(j.createdAt),
                  j.completedAt ? timeAgo(j.completedAt) : "—",
                  statusBadge(j.status),
                  j.status === "FAILED"
                    ? <Btn label={retrying === j.id ? "…" : "Retry"} onClick={() => retry(j.id)} variant="ghost" small />
                    : null,
                ]}
              />
            ))}
          </Table>
        )}
        <Pagination page={page} pages={pagination.pages} onPage={setPage} />
      </Card>

      {jobs.some((j) => j.status === "FAILED" && j.errorLog) && (
        <Card title="Error log">
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {jobs.filter((j) => j.status === "FAILED" && j.errorLog).map((j) => (
              <div key={j.id}>
                <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "4px" }}>{j.contentType} — {timeAgo(j.createdAt)}</p>
                <pre style={{ fontSize: "11px", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "var(--radius-sm)", padding: "8px 10px", color: "#ef4444", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0 }}>
                  {typeof j.errorLog === "string" ? j.errorLog : JSON.stringify(j.errorLog, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
