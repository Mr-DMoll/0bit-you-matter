"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import apiClient from "@/api/client";
import {
  PageHeader, Card, Btn, statusBadge, Spinner,
} from "@/features/admin/components/AdminShell";

const CONFIDENCE_LEVELS = [
  { label: "1 — Very uncertain",    value: 1 },
  { label: "2 — Somewhat uncertain", value: 2 },
  { label: "3 — Neutral",           value: 3 },
  { label: "4 — Fairly confident",  value: 4 },
  { label: "5 — Very confident",    value: 5 },
];

export function ReviewScreenPage() {
  const router   = useRouter();
  const params   = useParams();
  const reviewId = params?.reviewId as string;

  const [review,     setReview]     = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [loadError,  setLoadError]  = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [drafting,   setDrafting]   = useState(false);
  const [decision,   setDecision]   = useState<"VERIFIED" | "DISCARDED" | "">("");
  const [confidence, setConfidence] = useState(4);
  const [notes,      setNotes]      = useState("");
  const [error,      setError]      = useState("");
  const [draftMsg,   setDraftMsg]   = useState("");

  // Edit mode (career content editing)
  const [editing,  setEditing]  = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState("");

  const loadReview = () => {
    if (!reviewId) return;
    setLoading(true);
    setLoadError("");
    apiClient.get(`/content/reviews/${reviewId}`)
      .then((r) => {
        const rev = r.data.data;
        setReview(rev);
        // Pre-populate decision panel from existing data so re-edits are seamless
        if (rev.status === "APPROVED")  setDecision("VERIFIED");
        if (rev.status === "REJECTED")  setDecision("DISCARDED");
        if (rev.confidenceRating)       setConfidence(rev.confidenceRating);
        if (rev.notes)                  setNotes(rev.notes);
        if (rev.career) {
          setEditData({
            title:        rev.career.title        ?? "",
            overview:     rev.career.overview     ?? "",
            dayInTheLife: rev.career.dayInTheLife ?? "",
            howToGetThere:rev.career.howToGetThere?? "",
            saContext:    rev.career.saContext    ?? "",
            earningsMin:  rev.career.earningsMin  ?? "",
            earningsMax:  rev.career.earningsMax  ?? "",
          });
        }
      })
      .catch((e: any) => {
        const status  = e?.response?.status;
        const message = e?.response?.data?.message ?? e?.message ?? "Unknown error";
        setLoadError(`${status ? `${status} — ` : ""}${message}`);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReview(); }, [reviewId]);

  const saveEdits = async () => {
    if (!review?.career) return;
    setSaving(true); setSaveMsg("");
    try {
      // Only send fields that actually exist on the Career model
      const { title, overview, dayInTheLife, howToGetThere, saContext, earningsMin, earningsMax } = editData;
      await apiClient.patch(`/careers/${review.career.id}`, { title, overview, dayInTheLife, howToGetThere, saContext, earningsMin: earningsMin || null, earningsMax: earningsMax || null });
      await loadReview();
      setEditing(false);
      setSaveMsg("Changes saved ✓");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (e: any) {
      setSaveMsg(e?.response?.data?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    setDrafting(true); setDraftMsg(""); setError("");
    try {
      await apiClient.patch(`/content/reviews/${reviewId}`, { draft: true, confidenceRating: confidence, notes });
      setDraftMsg("Draft saved ✓");
      setTimeout(() => setDraftMsg(""), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to save draft");
    } finally {
      setDrafting(false);
    }
  };

  const submit = async () => {
    if (!decision) { setError("Please select Verify or Discard"); return; }
    setSubmitting(true); setError("");
    try {
      await apiClient.patch(`/content/reviews/${reviewId}`, { decision, confidenceRating: confidence, notes });
      router.push("/reviewer");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to submit");
      setSubmitting(false);
    }
  };

  const isCompleted = review?.status === "APPROVED" || review?.status === "REJECTED";

  if (loading) return <Spinner />;
  if (loadError || !review) return (
    <div style={{ padding: "60px 40px", textAlign: "center" }}>
      <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "8px" }}>
        Could not load review
      </p>
      {loadError && (
        <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "20px", fontFamily: "monospace" }}>
          {loadError}
        </p>
      )}
      <button
        onClick={loadReview}
        style={{ padding: "8px 18px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-sm)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", marginRight: "10px" }}
      >
        Retry
      </button>
      <button
        onClick={() => router.push("/reviewer")}
        style={{ padding: "8px 18px", background: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}
      >
        ← Back to queue
      </button>
    </div>
  );

  const career      = review.career;
  const tvetCollege = review.tvetCollege;

  // ── helpers ──────────────────────────────────────────────────────────────────
  const openUrl = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const googleSearch = (q: string) => openUrl(`https://www.google.com/search?q=${encodeURIComponent(q)}`);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Review Content"
        subtitle={`${review.contentType?.replace(/_/g, " ")} · Assigned to you for verification`}
        action={<Btn label="← Back to queue" onClick={() => router.push("/reviewer")} variant="ghost" />}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr", gap: "20px", alignItems: "start" }}>

        {/* ── Left: content ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* ── TVET / Private college panel ── */}
          {tvetCollege && (
            <>
              <Card title="Institution profile">
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                    {tvetCollege.logoUrl ? (
                      <img src={tvetCollege.logoUrl} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "contain", border: "1px solid var(--color-border)", background: "#fff", padding: 4 }} />
                    ) : (
                      <div style={{ width: 56, height: 56, borderRadius: 8, background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🏫</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 4px" }}>
                        {tvetCollege.name}
                        {tvetCollege.abbreviation && <span style={{ fontSize: 13, fontWeight: 400, color: "var(--color-text-muted)", marginLeft: 8 }}>({tvetCollege.abbreviation})</span>}
                      </p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "var(--color-text-muted)", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: 4, padding: "2px 8px" }}>
                          📍 {tvetCollege.province}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: tvetCollege.collegeType === "PUBLIC" ? "rgba(34,197,94,0.1)" : "rgba(168,85,247,0.1)", color: tvetCollege.collegeType === "PUBLIC" ? "#16a34a" : "#9333ea", border: `1px solid ${tvetCollege.collegeType === "PUBLIC" ? "rgba(34,197,94,0.3)" : "rgba(168,85,247,0.3)"}` }}>
                          {tvetCollege.collegeType === "PUBLIC" ? "Public (DHET-funded)" : "Private college"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Verify online buttons — core of institution review */}
                  <div>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
                      Verify this institution online
                    </p>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {tvetCollege.website && (
                        <button
                          onClick={() => openUrl(tvetCollege.website!)}
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-sm)", color: "var(--color-accent-text)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                        >
                          🌐 Visit website
                        </button>
                      )}
                      {tvetCollege.sourceUrl && (
                        <button
                          onClick={() => openUrl(tvetCollege.sourceUrl!)}
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                        >
                          📄 Source listing
                        </button>
                      )}
                      <button
                        onClick={() => googleSearch(`${tvetCollege.name} TVET college South Africa`)}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                      >
                        🔍 Google search
                      </button>
                      <button
                        onClick={() => googleSearch(`site:tvetcolleges.co.za OR site:dhet.gov.za "${tvetCollege.name}"`)}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                      >
                        📋 DHET / tvetcolleges.co.za
                      </button>
                    </div>
                  </div>

                  {tvetCollege.verifiedNote && (
                    <div style={{ padding: "10px 12px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "#16a34a" }}>
                      ℹ️ {tvetCollege.verifiedNote}
                    </div>
                  )}
                </div>
              </Card>

              <Card title="What to check">
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    "The institution name matches a real South African TVET / private college",
                    "You can find it on tvetcolleges.co.za, DHET.gov.za, or its own website",
                    "Province listed is correct",
                    "College type (Public / Private) is accurate",
                    "Website URL is reachable and belongs to this institution",
                    "No duplicate entry already exists for this college",
                  ].map((check, i) => (
                    <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <span style={{ color: "#22c55e", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{check}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* ── Career panel ── */}
          {career && (
            <>
              <Card
                title="Career profile"
                action={
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {saveMsg && <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 500 }}>{saveMsg}</span>}
                    {editing ? (
                      <>
                        <Btn label={saving ? "Saving…" : "Save changes"} onClick={saveEdits} small />
                        <Btn label="Cancel" onClick={() => setEditing(false)} variant="ghost" small />
                      </>
                    ) : (
                      <Btn label="✏ Edit" onClick={() => setEditing(true)} variant="ghost" small />
                    )}
                  </div>
                }
              >
                {editing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {[
                      { key: "title",         label: "Title",             rows: 1 },
                      { key: "overview",      label: "Overview",          rows: 5 },
                      { key: "dayInTheLife",  label: "Day in the life",   rows: 4 },
                      { key: "howToGetThere", label: "How to get there",  rows: 4 },
                      { key: "saContext",     label: "SA context",        rows: 3 },
                    ].map(({ key, label, rows }) => (
                      <div key={key}>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                          {label}
                        </label>
                        {rows === 1 ? (
                          <input
                            type="text"
                            value={editData[key] ?? ""}
                            onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                            style={{ width: "100%", padding: "8px 10px", fontSize: "13px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }}
                          />
                        ) : (
                          <textarea
                            value={editData[key] ?? ""}
                            onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                            rows={rows}
                            style={{ width: "100%", padding: "8px 10px", fontSize: "13px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", resize: "vertical", outline: "none", boxSizing: "border-box" }}
                          />
                        )}
                      </div>
                    ))}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      {[
                        { key: "earningsMin", label: "Earnings min (ZAR/yr)" },
                        { key: "earningsMax", label: "Earnings max (ZAR/yr)" },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{label}</label>
                          <input
                            type="number"
                            value={editData[key] ?? ""}
                            onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                            style={{ width: "100%", padding: "8px 10px", fontSize: "13px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Title</p>
                      <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{career.title}</p>
                      {career.cluster?.name && <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "3px" }}>{career.cluster.name}</p>}
                    </div>
                    {(career.earningsMin || career.earningsMax) && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        {[
                          ["Earnings min", career.earningsMin ? `R${Number(career.earningsMin).toLocaleString()}/yr` : "—"],
                          ["Earnings max", career.earningsMax ? `R${Number(career.earningsMax).toLocaleString()}/yr` : "—"],
                        ].map(([label, val]) => (
                          <div key={String(label)} style={{ padding: "10px", background: "var(--color-bg-secondary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                            <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "2px" }}>{label}</p>
                            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{val}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {[
                      { label: "Overview",         value: career.overview      },
                      { label: "Day in the life",  value: career.dayInTheLife  },
                      { label: "How to get there", value: career.howToGetThere },
                      { label: "SA context",       value: career.saContext     },
                    ].filter(s => s.value).map(({ label, value }) => (
                      <div key={label}>
                        <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{label}</p>
                        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card title="Verification checklist">
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    "Title matches a real South African career",
                    "Description is factually correct and appropriate for Grade 9–12 learners",
                    "Key duties reflect actual work performed in this role",
                    "APS score range is realistic based on university requirements",
                    "Salary range is current and sourced from credible SA data",
                    "No hallucinated institutions, statistics, or qualifications",
                    "Language is clear and accessible (not overly technical)",
                  ].map((check, i) => (
                    <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <span style={{ color: "#22c55e", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{check}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>

        {/* ── Right: decision ───────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Card title={isCompleted ? "Edit decision" : "Your decision"}>
            {isCompleted && (
              <div style={{ padding: "8px 12px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-sm)", fontSize: "12px", color: "#6366f1", marginBottom: "14px", display: "flex", alignItems: "center", gap: 6 }}>
                ✏️ You already submitted this review. Change your decision below and re-publish if needed.
              </div>
            )}

            {error && (
              <div style={{ padding: "10px 12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", fontSize: "12px", color: "#ef4444", marginBottom: "12px" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "8px" }}>Decision *</p>
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["VERIFIED", "DISCARDED"] as const).map((d) => {
                    const isVerify  = d === "VERIFIED";
                    const active    = decision === d;
                    const col       = isVerify ? "#22c55e" : "#ef4444";
                    return (
                      <button
                        key={d}
                        onClick={() => setDecision(d)}
                        style={{
                          flex: 1, padding: "12px 8px",
                          border: `2px solid ${active ? col : "var(--color-border)"}`,
                          background: active ? `${col}12` : "var(--color-bg-secondary)",
                          borderRadius: "var(--radius-sm)", fontSize: "13px", fontWeight: 700,
                          color: active ? col : "var(--color-text-muted)",
                          cursor: "pointer", transition: "all 0.15s", lineHeight: 1.3,
                        }}
                      >
                        {isVerify ? "✓ Verify" : "✗ Discard"}
                        <br />
                        <span style={{ fontSize: "10px", fontWeight: 400, opacity: 0.7 }}>
                          {isVerify ? "Publish as verified" : "Archive permanently"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "6px" }}>Confidence score</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {CONFIDENCE_LEVELS.map(({ label, value }) => (
                    <label key={value} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input type="radio" name="confidence" value={value} checked={confidence === value} onChange={() => setConfidence(value)} />
                      <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "4px" }}>
                  Notes <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span>
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={decision === "DISCARDED"
                    ? "What was wrong? This will be logged against the discard."
                    : "Any observations for the content record…"}
                  rows={3}
                  style={{ width: "100%", padding: "8px 10px", fontSize: "12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", resize: "vertical", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Save draft — non-destructive, stays IN_PROGRESS */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {!isCompleted && (
                  <button
                    onClick={saveDraft}
                    disabled={drafting}
                    style={{
                      padding: "10px", borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg-secondary)",
                      color: "var(--color-text-secondary)",
                      fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {drafting ? "Saving…" : draftMsg || "💾 Save draft"}
                  </button>
                )}

                {/* Publish / re-publish */}
                <button
                  onClick={submit}
                  disabled={!decision || submitting}
                  style={{
                    padding: "11px", borderRadius: "var(--radius-sm)", border: "none",
                    cursor: decision ? "pointer" : "not-allowed",
                    background: !decision ? "var(--color-bg-subtle)" : decision === "VERIFIED" ? "#22c55e" : "#ef4444",
                    color: !decision ? "var(--color-text-muted)" : "#fff",
                    fontSize: "14px", fontWeight: 700, transition: "all 0.15s",
                  }}
                >
                  {submitting ? "Submitting…"
                    : !decision ? "Select a decision first"
                    : isCompleted
                      ? (decision === "VERIFIED" ? "✓ Re-publish as verified" : "✗ Re-discard content")
                      : (decision === "VERIFIED" ? "✓ Verify & publish" : "✗ Discard content")}
                </button>
              </div>
            </div>
          </Card>

          <Card title="Assignment details">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", color: "var(--color-text-muted)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Status</span><span>{statusBadge(review.status)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Content type</span>
                <span style={{ color: "var(--color-text-secondary)", textTransform: "capitalize" }}>{review.contentType?.toLowerCase()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Assigned</span>
                <span style={{ color: "var(--color-text-secondary)" }}>{new Date(review.assignedAt ?? review.createdAt).toLocaleDateString("en-ZA")}</span>
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
