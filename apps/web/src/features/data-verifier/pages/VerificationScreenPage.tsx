"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import apiClient from "@/api/client";
import {
  PageHeader, Card, Btn, statusBadge, Spinner,
} from "@/features/admin/components/AdminShell";

const FIELD_LABEL = (label: string, value: any) =>
  value != null ? (
    <div>
      <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>{label}</p>
      <p style={{ fontSize: "14px", color: "var(--color-text-primary)" }}>{String(value)}</p>
    </div>
  ) : null;

export function VerificationScreenPage() {
  const router = useRouter();
  const params = useParams();
  const verificationId = params?.verificationId as string;

  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState<"VERIFIED" | "REJECTED" | "">("");
  const [notes, setNotes]       = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [error, setError]       = useState("");

  useEffect(() => {
    if (!verificationId) return;
    apiClient.get(`/content/verifications/${verificationId}`)
      .then((r) => setVerification(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [verificationId]);

  const submit = async () => {
    if (!decision) { setError("Please select Verified or Rejected"); return; }
    if (decision === "REJECTED" && !notes.trim()) { setError("Notes required when rejecting — describe what was wrong"); return; }
    setSubmitting(true); setError("");
    try {
      await apiClient.patch(`/content/verifications/${verificationId}/submit`, { decision, notes, sourceUrl });
      router.back();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to submit");
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (!verification) return <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Verification not found</div>;

  const { bursary, university, universityProgramme, career, dataType } = verification;
  const item = bursary ?? universityProgramme ?? career ?? university;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Verify Data"
        subtitle={`${dataType} — cross-check all fields against official sources`}
        action={<Btn label="← Back" onClick={() => router.back()} variant="ghost" />}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr", gap: "20px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Card title="Data to verify">
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {item && Object.entries(item).filter(([k]) =>
                !["id", "createdAt", "updatedAt", "deletedAt", "status", "viewCount"].includes(k)
              ).map(([key, value]) => {
                if (value == null || typeof value === "object") return null;
                const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
                return FIELD_LABEL(label, value);
              })}
            </div>
          </Card>

          <Card title="Verification checklist">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {dataType === "BURSARY" && [
                "Bursary amount matches the provider's website",
                "Application deadline is current and has not passed",
                "Application link is live and goes to the correct page",
                "Eligibility criteria (subjects, citizenship, income) are accurate",
                "Provider name and contact details are correct",
              ].map((check, i) => (
                <div key={i} style={{ display: "flex", gap: "10px" }}>
                  <span style={{ color: "#22c55e", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{check}</span>
                </div>
              ))}
              {dataType === "UNIVERSITY_PROGRAMME" && [
                "APS score requirement matches the university's current prospectus",
                "Programme name is correct and still offered",
                "Duration and NQF level are accurate",
                "Subject requirements (e.g. maths, physical science) are stated correctly",
                "Faculty and campus details are correct",
              ].map((check, i) => (
                <div key={i} style={{ display: "flex", gap: "10px" }}>
                  <span style={{ color: "#22c55e", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{check}</span>
                </div>
              ))}
              {(dataType === "CAREER" || !dataType) && [
                "Career title is a recognised occupation in South Africa",
                "Salary range is consistent with current SA market data",
                "Qualifications and APS requirements are realistic",
                "No fictitious institutions or certifications listed",
              ].map((check, i) => (
                <div key={i} style={{ display: "flex", gap: "10px" }}>
                  <span style={{ color: "#22c55e", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{check}</span>
                </div>
              ))}
            </div>
          </Card>
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
                  {(["VERIFIED", "REJECTED"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDecision(d)}
                      style={{
                        flex: 1, padding: "10px",
                        border: `2px solid ${decision === d ? (d === "VERIFIED" ? "#22c55e" : "#ef4444") : "var(--color-border)"}`,
                        background: decision === d ? (d === "VERIFIED" ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)") : "var(--color-bg-secondary)",
                        borderRadius: "var(--radius-sm)", fontSize: "13px", fontWeight: 600,
                        color: decision === d ? (d === "VERIFIED" ? "#22c55e" : "#ef4444") : "var(--color-text-muted)",
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      {d === "VERIFIED" ? "✓ Verified" : "✗ Reject"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "4px" }}>Source URL used</p>
                <input
                  value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://www.university.ac.za/prospectus/..."
                  style={{ width: "100%", padding: "8px 10px", fontSize: "12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "4px" }}>
                  Notes {decision === "REJECTED" && <span style={{ color: "#ef4444" }}>*</span>}
                </p>
                <textarea
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder={decision === "REJECTED" ? "What was incorrect? What should be changed?" : "Optional verification notes"}
                  rows={4}
                  style={{ width: "100%", padding: "8px 10px", fontSize: "12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", resize: "vertical", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <Btn label={submitting ? "Submitting…" : "Submit verification"} onClick={submit} />
            </div>
          </Card>

          <Card title="Assignment details">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", color: "var(--color-text-muted)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Status</span>
                {statusBadge(verification.status)}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Type</span>
                <span style={{ color: "var(--color-text-secondary)" }}>{verification.dataType}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Queued</span>
                <span style={{ color: "var(--color-text-secondary)" }}>{new Date(verification.createdAt).toLocaleDateString("en-ZA")}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
