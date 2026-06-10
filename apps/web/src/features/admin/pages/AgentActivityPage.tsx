"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, Table, TableRow, statusBadge,
  Spinner, Empty, Select, Pagination, timeAgo, displayName,
} from "../components/AdminShell";

export function AdminAgentActivityPage() {
  const [jobs, setJobs]             = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]       = useState(true);
  const [type, setType]             = useState("");
  const [page, setPage]             = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    const params: any = { page };
    if (type) params.type = type;
    apiClient.get("/content/jobs", { params })
      .then((r) => { setJobs(r.data.data.jobs); setPagination(r.data.data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, type]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader title="Agent Activity" subtitle="Full log of all AI agent actions" />

      <div style={{ display: "flex", gap: "10px" }}>
        <Select value={type} onChange={(v) => { setType(v); setPage(1); }} options={[
          { label: "All types",            value: "" },
          { label: "Career",               value: "CAREER" },
          { label: "University Programme", value: "UNIVERSITY_PROGRAMME" },
          { label: "Bursary",              value: "BURSARY" },
          { label: "Assessment Question",  value: "ASSESSMENT_QUESTION" },
        ]} />
      </div>

      <Card noPad>
        {loading ? <Spinner /> : jobs.length === 0 ? <Empty message="No agent activity yet" /> : (
          <Table headers={["Content type", "Prompt used", "Requested by", "Retries", "Status", "Result", "When"]}>
            {jobs.map((j) => (
              <TableRow
                key={j.id}
                cols={[
                  j.contentType,
                  j.promptTemplate ? `${j.promptTemplate.name} v${j.promptTemplate.version}` : "—",
                  displayName(j.requestedBy),
                  j.retryCount,
                  statusBadge(j.status),
                  j.outputCareerId ? "Career created" : j.result ? "Output saved" : j.errorLog ? (
                    <span style={{ color: "#ef4444", fontSize: "11px" }}>
                      {String(j.errorLog).slice(0, 60)}…
                    </span>
                  ) : "—",
                  timeAgo(j.createdAt),
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
