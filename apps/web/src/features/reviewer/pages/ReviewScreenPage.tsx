"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import apiClient from "@/api/client";
import {
  PageHeader, Card, Btn, statusBadge, Spinner,
} from "@/features/admin/components/AdminShell";

const CONFIDENCE_LEVELS = [
  { label: "1 — Very uncertain", value: 1 },
  { label: "2 — Somewhat uncertain", value: 2 },
  { label: "3 — Neutral", value: 3 },
  { label: "4 — Fairly confident", value: 4 },
  { label: "5 — Very confident", value: 5 },
];

export function ReviewScreenPage() {
  const router = useRouter();
  const params = useParams();
  const reviewId = params?.reviewId as string;

  const [review, setReview]       = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision]   = useState<"APPROVED" | "REJECTED" | "">("");
  const [confidence, setConfidence] = useState(4);
  const [notes, setNotes]         = useState("");
  const [error, setError]         = useState("");

  useEffect(() => {
    if (!reviewId) return;
    apiClient.get(`/content/reviews/${reviewId}`)
      .then((r) => setReview(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reviewId]);

  const submit = async () => {
    if (!decision) { setError("Please select Approve or Reject"); return; }
    if (decision === "REJECTED" && !notes.trim()) { setError("Notes are required when rejecting — explain what was wrong so the prompt can be improved"); return; }
    setSubmitting(true); setError("");
    try {
      await apiClient.patch(`/content/reviews/${reviewId}/submit`, { decision, confidenceScore: confidence, notes });
      router.push("/reviewer");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to submit review");
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (!review) return <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Review not found</div>;

  const career = review.career;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Review Content"
        subtitle={`Review assignment — ${review.contentType}`}
        action={<Btn label="← Back to queue" onClick={() => router.push("/reviewer")} variant="ghost" />}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr", gap: "20px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {career && (
            <>
              <Card title="Career profile">
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Title</p>
                    <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)" }}>{career.title}</p>
                  </div>
                  {career.description && (
                    <div>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Description</p>
                      <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{career.description}</p>
                    </div>
                  )}
                  {career.keyDuties && (
                    <div>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Key duties</p>
                      <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{career.keyDuties}</p>
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                    {[
                      ["Min APS", career.minAps ?? "—"],
                      ["Salary min", career.salaryMin ? `R${Number(career.salaryMin).toLocaleString()}` : "—"],
                      ["Salary max", career.salaryMax ? `R${Number(career.salaryMax).toLocaleString()}` : "—"],
                    ].map(([label, val]) => (
                      <div key={label} style={{ padding: "10px", background: "var(--color-bg-secondary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                        <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "2px" }}>{label}</p>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card title="Review checklist">
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    "Title is accurate and matches a real South African career",
                    "Description is factually correct and appropriate for Grade 9–12 learners",
                    "Key duties reflect actual work performed in this role",
                    "APS score range is realistic based on typical university requirements",
                    "Salary range is current and sourced from credible SA data",
                    "No hallucinated institutions, statistics or qualifications",
                    "Language is clear and accessible (not overly technical)",
                  ].map((check, i) => (
                    <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <span style={{ color: "#22c55e", fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>✓</span>
                      <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{check}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Card title="Your decision">
            {error && (
              <div style={{ padding: "10px 12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", fontSize: "12px", color: "#ef4444", marginBottom: "12px" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "8px" }}>Decision *</p>
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["APPROVED", "REJECTED"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDecision(d)}
                      style={{
                        flex: 1, padding: "10px", border: `2px solid ${decision === d ? (d === "APPROVED" ? "#22c55e" : "#ef4444") : "var(--color-border)"}`,
                        background: decision === d ? (d === "APPROVED" ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)") : "var(--color-bg-secondary)",
                        borderRadius: "var(--radius-sm)", fontSize: "13px", fontWeight: 600,
                        color: decision === d ? (d === "APPROVED" ? "#22c55e" : "#ef4444") : "var(--color-text-muted)",
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      {d === "APPROVED" ? "✓ Approve" : "✗ Reject"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "6px" }}>
                  Confidence score
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {CONFIDENCE_LEVELS.map(({ label, value }) => (
                    <label key={value} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="radio" name="confidence" value={value}
                        checked={confidence === value} onChange={() => setConfidence(value)}
                      />
                      <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "4px" }}>
                  Notes {decision === "REJECTED" && <span style={{ color: "#ef4444" }}>*</span>}
                </p>
                <textarea
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder={decision === "REJECTED" ? "Describe what was factually incorrect or missing…" : "Optional — add context for the content team"}
                  rows={4}
                  style={{ width: "100%", padding: "8px 10px", fontSize: "12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", resize: "vertical", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <Btn label={submitting ? "Submitting…" : "Submit review"} onClick={submit} />
            </div>
          </Card>

          <Card title="Assignment details">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", color: "var(--color-text-muted)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Status</span>
                <span>{statusBadge(review.status)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Assigned</span>
                <span style={{ color: "var(--color-text-secondary)" }}>{new Date(review.assignedAt).toLocaleDateString("en-ZA")}</span>
              </div>
              {review.dueAt && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Due</span>
                  <span style={{ color: new Date(review.dueAt) < new Date() ? "#ef4444" : "var(--color-text-secondary)" }}>
                    {new Date(review.dueAt).toLocaleDateString("en-ZA")}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
