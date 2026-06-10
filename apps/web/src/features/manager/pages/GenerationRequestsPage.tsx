"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, Table, TableRow, statusBadge,
  Spinner, Empty, Select, Btn, timeAgo,
} from "@/features/admin/components/AdminShell";

export function ManagerGenerationRequestsPage() {
  const [jobs, setJobs]           = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]     = useState("");
  const [error, setError]         = useState("");

  // Form state
  const [contentType, setContentType] = useState("CAREER");
  const [notes, setNotes]             = useState("");

  const load = useCallback(() => {
    setLoading(true);
    apiClient.get("/content/jobs", { params: { page: 1 } })
      .then((r) => setJobs(r.data.data.jobs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!contentType) { setError("Content type is required"); return; }
    setSubmitting(true); setError("");
    try {
      await apiClient.post("/content/jobs", { contentType, parameters: { notes, requestedByManager: true } });
      setSuccess("Request submitted — it will appear in the generation queue.");
      setNotes("");
      setTimeout(() => setSuccess(""), 5000);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Generation Requests"
        subtitle="Request new career, bursary or university entries to be AI-generated and queued for review"
      />

      <Card title="New request">
        {success && (
          <div style={{ padding: "10px 14px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#22c55e", marginBottom: "16px" }}>
            {success}
          </div>
        )}
        {error && (
          <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#ef4444", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "480px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "4px" }}>Content type *</label>
            <Select
              value={contentType}
              onChange={setContentType}
              options={[
                { label: "Career",               value: "CAREER" },
                { label: "Bursary",              value: "BURSARY" },
                { label: "University Programme", value: "UNIVERSITY_PROGRAMME" },
              ]}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "4px" }}>Notes / context for the generator</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. My learners are asking about renewable energy careers in Mpumalanga…"
              rows={3}
              style={{ width: "100%", padding: "8px 12px", fontSize: "13px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", resize: "vertical", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <Btn label={submitting ? "Submitting…" : "Submit request"} onClick={handleSubmit} />
          </div>
        </div>
      </Card>

      <Card title="My recent requests" noPad>
        {loading ? <Spinner /> : jobs.length === 0 ? <Empty message="No requests submitted yet" /> : (
          <Table headers={["Type", "Notes", "Status", "Submitted"]}>
            {jobs.slice(0, 20).map((j) => (
              <TableRow
                key={j.id}
                cols={[
                  j.contentType,
                  (j.parameters as any)?.notes
                    ? <span style={{ maxWidth: "300px", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {(j.parameters as any).notes}
                      </span>
                    : "—",
                  statusBadge(j.status),
                  timeAgo(j.createdAt),
                ]}
              />
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
