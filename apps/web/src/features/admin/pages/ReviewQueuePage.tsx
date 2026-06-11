"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, StatCard, Table, TableRow, statusBadge,
  Spinner, Empty, Select, Pagination, Btn, displayName,
} from "../components/AdminShell";

// ── Content-type config ───────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  CAREER:    { label: "Career",      color: "#6366f1", bg: "rgba(99,102,241,0.10)",  border: "rgba(99,102,241,0.25)"  },
  PATHWAY:   { label: "Pathway",     color: "#0ea5e9", bg: "rgba(14,165,233,0.10)",  border: "rgba(14,165,233,0.25)"  },
  BURSARY:   { label: "Bursary",     color: "#f59e0b", bg: "rgba(245,158,11,0.10)",  border: "rgba(245,158,11,0.25)"  },
  TVET:      { label: "TVET",        color: "#22c55e", bg: "rgba(34,197,94,0.10)",   border: "rgba(34,197,94,0.25)"   },
  PRIVATE:   { label: "Private",     color: "#a855f7", bg: "rgba(168,85,247,0.10)",  border: "rgba(168,85,247,0.25)"  },
  QUESTION:  { label: "Assessment",  color: "#ec4899", bg: "rgba(236,72,153,0.10)",  border: "rgba(236,72,153,0.25)"  },
};

function TypeBadge({ type }: { type: string }) {
  const s = TYPE_CONFIG[type] ?? { label: type, color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.25)" };
  return (
    <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: "999px", color: s.color, background: s.bg, border: `1px solid ${s.border}`, whiteSpace: "nowrap", letterSpacing: "0.02em" }}>
      {s.label}
    </span>
  );
}

// ── Tag pill filter ───────────────────────────────────────────────────────────

function TagFilter({
  active,
  onChange,
  counts,
}: {
  active: string;
  onChange: (t: string) => void;
  counts: Record<string, number>;
}) {
  const tags = [
    { key: "",         label: "All" },
    { key: "CAREER",   label: "Careers" },
    { key: "PATHWAY",  label: "Pathways" },
    { key: "BURSARY",  label: "Bursaries" },
    { key: "TVET",     label: "TVET" },
    { key: "PRIVATE",  label: "Private" },
    { key: "QUESTION", label: "Assessments" },
  ];

  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
      {tags.map((t) => {
        const isActive = active === t.key;
        const cfg = t.key ? TYPE_CONFIG[t.key] : null;
        const count = t.key ? (counts[t.key] ?? 0) : Object.values(counts).reduce((a, b) => a + b, 0);

        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              padding: "5px 12px", borderRadius: "999px", cursor: "pointer",
              fontSize: "12px", fontWeight: isActive ? 700 : 500,
              border: isActive
                ? `2px solid ${cfg?.color ?? "var(--color-accent)"}`
                : "1px solid var(--color-border)",
              background: isActive
                ? (cfg?.bg ?? "rgba(99,102,241,0.1)")
                : "var(--color-card-bg)",
              color: isActive
                ? (cfg?.color ?? "var(--color-accent)")
                : "var(--color-text-muted)",
              transition: "all 0.12s",
            }}
          >
            {t.label}
            {count > 0 && (
              <span style={{
                fontSize: "10px", fontWeight: 700, minWidth: "16px", height: "16px",
                borderRadius: "999px", display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: isActive ? (cfg?.color ?? "var(--color-accent)") : "var(--color-bg-secondary)",
                color: isActive ? "#fff" : "var(--color-text-muted)",
                padding: "0 4px",
              }}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Reviewer chip ─────────────────────────────────────────────────────────────

function ReviewerChip({ reviewer, onReassign }: { reviewer: any; onReassign: () => void }) {
  const name = reviewer?.displayName
    ?? (reviewer?.firstName ? `${reviewer.firstName} ${reviewer.lastName ?? ""}`.trim() : null)
    ?? reviewer?.email
    ?? "Unknown";
  const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 800, color: "#6366f1", flexShrink: 0 }}>
        {initials}
      </div>
      <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", maxWidth: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
      <button onClick={onReassign} title="Reassign" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "var(--color-text-muted)", padding: "0", lineHeight: 1 }}>↺</button>
    </div>
  );
}

// ── Bursary edit panel (inside preview) ──────────────────────────────────────

function BursaryEditFields({ item, onSaved, onDeleted }: { item: QueueItem; onSaved: (updated: any) => void; onDeleted?: () => void }) {
  const d = item.data;
  const [closeDate,      setCloseDate]      = useState(d.closeDate ? new Date(d.closeDate).toISOString().slice(0, 10) : "");
  const [applicationUrl, setApplicationUrl] = useState(d.applicationUrl ?? "");
  const [amount,         setAmount]         = useState(d.amount ?? "");
  const [saving,         setSaving]         = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(false);

  const isExpired     = d.closeDate && new Date(d.closeDate) < new Date();
  const isKnowledge   = (d.eligibilityCriteria as any)?._source?.includes("AI knowledge");
  const hasNoProof    = !d.applicationUrl && !d.sourceUrl?.includes("zabursaries") && !d.sourceUrl?.includes("bursariesportal") && !d.sourceUrl?.includes("sascholarships");
  const showNoProof   = isKnowledge || (hasNoProof && !applicationUrl);

  const deleteBursary = async () => {
    setDeleting(true);
    try {
      await apiClient.patch(`/bursaries/${item.id}`, { status: "ARCHIVED" });
      onDeleted?.();
    } catch { /* ignore */ } finally { setDeleting(false); setConfirmDelete(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiClient.patch(`/bursaries/${item.id}`, {
        closeDate:      closeDate      || null,
        applicationUrl: applicationUrl || null,
        amount:         amount         || null,
      });
      onSaved(res.data.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", fontSize: "13px", boxSizing: "border-box",
    background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.06em", color: "var(--color-text-muted)", marginBottom: "5px",
  };

  return (
    <div style={{ border: `1px solid ${showNoProof ? "rgba(239,68,68,0.3)" : "var(--color-border)"}`, borderRadius: "var(--radius-sm)", overflow: "hidden", marginBottom: "20px" }}>
      {/* Header */}
      <div style={{ padding: "10px 14px", background: showNoProof ? "rgba(239,68,68,0.04)" : "var(--color-bg-secondary)", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>✏️ Reviewer verification</span>
        <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Verify the bursary is real, then fill in missing fields</span>
      </div>

      {/* No proof warning */}
      {showNoProof && (
        <div style={{ padding: "12px 14px", background: "rgba(239,68,68,0.06)", borderBottom: "1px solid rgba(239,68,68,0.15)" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#ef4444", marginBottom: "4px" }}>⚠ No verification link — this bursary was generated from AI knowledge</p>
          <p style={{ fontSize: "12px", color: "#b91c1c", lineHeight: 1.6 }}>
            Claude inferred this bursary exists based on training data — it did <strong>not</strong> find it on a real webpage.
            Before approving, you must visit the provider's website and confirm the bursary is real and active.
            If you cannot find it, <strong>remove it</strong> so learners are not misled.
          </p>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} style={{ marginTop: "8px", padding: "5px 12px", fontSize: "12px", fontWeight: 600, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-sm)", color: "#ef4444", cursor: "pointer" }}>
              Remove this bursary
            </button>
          ) : (
            <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "#b91c1c", fontWeight: 600 }}>Confirm remove?</span>
              <button onClick={deleteBursary} disabled={deleting} style={{ padding: "4px 12px", fontSize: "12px", fontWeight: 700, background: "#ef4444", border: "none", borderRadius: "var(--radius-sm)", color: "#fff", cursor: "pointer" }}>
                {deleting ? "Removing…" : "Yes, remove"}
              </button>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: "4px 10px", fontSize: "12px", background: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-muted)", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Source website — most important link for verification */}
        <div>
          <label style={labelStyle}>
            Source website
            {isKnowledge && <span style={{ fontWeight: 400, textTransform: "none", marginLeft: "6px", color: "#ef4444" }}>(AI-inferred — NOT a bursary page)</span>}
          </label>
          {d.sourceUrl ? (
            <a href={d.sourceUrl} target="_blank" rel="noreferrer"
               style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "13px", color: isKnowledge ? "#ef4444" : "var(--color-accent)", textDecoration: "none", padding: "7px 12px", background: isKnowledge ? "rgba(239,68,68,0.06)" : "rgba(99,102,241,0.06)", border: `1px solid ${isKnowledge ? "rgba(239,68,68,0.2)" : "rgba(99,102,241,0.2)"}`, borderRadius: "var(--radius-sm)" }}>
              {isKnowledge ? "🏢" : "🔗"} {d.sourceUrl.replace(/^https?:\/\//, "").slice(0, 50)} ↗
              {isKnowledge && <span style={{ marginLeft: "4px", opacity: 0.7 }}>(company homepage)</span>}
            </a>
          ) : <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No source URL recorded</span>}
        </div>

        {/* Application URL */}
        <div>
          <label style={labelStyle}>Application URL <span style={{ fontWeight: 400, textTransform: "none" }}>(where learners apply)</span></label>
          <input style={inputStyle} type="url" value={applicationUrl} onChange={e => setApplicationUrl(e.target.value)} placeholder="https://apply.company.co.za/bursary" />
        </div>

        {/* Close date */}
        <div>
          <label style={labelStyle}>
            Closing date
            {isExpired && <span style={{ marginLeft: "8px", color: "#ef4444", fontWeight: 700, textTransform: "none" }}>⚠ Currently expired — update or this won't show to learners</span>}
          </label>
          <input style={inputStyle} type="date" value={closeDate} onChange={e => setCloseDate(e.target.value)} />
        </div>

        {/* Amount */}
        <div>
          <label style={labelStyle}>Value / amount</label>
          <input style={inputStyle} type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. Full cost of study, Up to R80 000/year" />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          {saved
            ? <span style={{ fontSize: "13px", color: "#22c55e", fontWeight: 600 }}>✓ Saved</span>
            : <Btn label={saving ? "Saving…" : "Save changes"} onClick={save} small />}
        </div>
      </div>
    </div>
  );
}

// ── Preview panel ─────────────────────────────────────────────────────────────

function PreviewPanel({ item, onClose, onUpdated }: { item: QueueItem; onClose: () => void; onUpdated?: () => void }) {
  const Sec = ({ title, content }: { title: string; content?: string | null }) =>
    content ? (
      <div style={{ marginBottom: "16px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)", marginBottom: "6px" }}>{title}</p>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{content}</p>
      </div>
    ) : null;

  const d = item.data;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 40 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "560px", maxWidth: "92vw", background: "var(--color-card-bg)", borderLeft: "1px solid var(--color-card-border)", zIndex: 50, overflowY: "auto", boxShadow: "-4px 0 32px rgba(0,0,0,0.14)" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", position: "sticky", top: 0, background: "var(--color-card-bg)", zIndex: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
              <TypeBadge type={item.type} />
              {statusBadge(d.status)}
            </div>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>{item.label}</p>
            {item.sub && <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{item.sub}</p>}
            {item.review?.reviewer && (
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "3px" }}>
                👤 {displayName(item.review.reviewer)}
                {item.review.dueAt && ` · Due ${new Date(item.review.dueAt).toLocaleDateString("en-ZA")}`}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "22px", color: "var(--color-text-muted)", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: "20px" }}>
          {/* Info notice */}
          <div style={{ padding: "10px 14px", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "var(--radius-sm)", marginBottom: "20px", fontSize: "12px", color: "#6366f1" }}>
            Reviewer preview — this is what the assigned reviewer will see before approving or rejecting.
          </div>

          {/* Career fields */}
          {item.type === "CAREER" && (
            <>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                {d.cluster?.name && <span style={{ fontSize: "12px", padding: "3px 10px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "999px", color: "var(--color-text-muted)" }}>{d.cluster.name}</span>}
                {(d.riasecCodes ?? []).map((c: string) => <span key={c} style={{ fontSize: "12px", fontWeight: 700, padding: "3px 10px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "999px", color: "var(--color-accent)" }}>{c}</span>)}
              </div>
              {d.earningsMin && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                  <div style={{ padding: "10px 12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
                    <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Salary range</p>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginTop: "2px" }}>R{(d.earningsMin/1000).toFixed(0)}k – R{(d.earningsMax/1000).toFixed(0)}k/yr</p>
                  </div>
                  {d.nqfLevelMin && (
                    <div style={{ padding: "10px 12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
                      <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Min NQF</p>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginTop: "2px" }}>NQF {d.nqfLevelMin}</p>
                    </div>
                  )}
                </div>
              )}
              <Sec title="Overview"         content={d.overview} />
              <Sec title="Day in the life"  content={d.dayInTheLife} />
              <Sec title="How to get there" content={d.howToGetThere} />
              <Sec title="SA Context"       content={d.saContext} />
            </>
          )}

          {/* Pathway fields */}
          {item.type === "PATHWAY" && (
            <>
              <Sec title="Entry requirements" content={d.entryRequirements} />
              <Sec title="Qualification earned" content={d.qualificationEarned} />
              {d.fundingOptions?.length > 0 && <Sec title="Funding" content={(d.fundingOptions ?? []).join(", ")} />}
              <Sec title="Employment note" content={d.employmentNote} />
              {d.pros?.length > 0 && <Sec title="Pros" content={(d.pros ?? []).join("\n")} />}
              {d.cons?.length > 0 && <Sec title="Cons" content={(d.cons ?? []).join("\n")} />}
            </>
          )}

          {/* Bursary fields */}
          {item.type === "BURSARY" && (
            <>
              {/* Editable fields panel — reviewer verifies and fills in what AI missed */}
              <BursaryEditFields
                item={item}
                onSaved={(updated) => { Object.assign(item.data, updated); onUpdated?.(); }}
                onDeleted={() => { onUpdated?.(); onClose(); }}
              />

              <Sec title="Description" content={d.description} />

              {/* Fields of study */}
              {d.fieldsOfStudy?.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)", marginBottom: "6px" }}>Fields of study</p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {d.fieldsOfStudy.map((f: string) => (
                      <span key={f} style={{ fontSize: "12px", padding: "3px 10px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "999px", color: "#d97706" }}>{f}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Eligibility criteria */}
              {d.eligibilityCriteria && Object.keys(d.eligibilityCriteria).length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)", marginBottom: "6px" }}>Eligibility</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {Object.entries(d.eligibilityCriteria as Record<string, any>).filter(([, v]) => v != null && v !== false).map(([k, v]) => (
                      <div key={k} style={{ fontSize: "13px", color: "var(--color-text-secondary)", display: "flex", gap: "8px" }}>
                        <span style={{ color: "var(--color-text-muted)", minWidth: "130px", textTransform: "capitalize" }}>{k.replace(/([A-Z])/g, " $1")}</span>
                        <span>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TVET / Private fields */}
          {(item.type === "TVET" || item.type === "PRIVATE") && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                <div style={{ padding: "10px 12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Province</p>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginTop: "2px" }}>{d.province ?? "—"}</p>
                </div>
                <div style={{ padding: "10px 12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Website</p>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginTop: "2px" }}>
                    {d.website ? <a href={d.website} target="_blank" rel="noreferrer" style={{ color: "var(--color-accent)" }}>Visit site ↗</a> : "—"}
                  </p>
                </div>
              </div>
              <Sec title="Verified note" content={d.verifiedNote} />
            </>
          )}

          {/* Assessment question */}
          {item.type === "QUESTION" && (
            <>
              <Sec title="Question" content={d.questionText} />
              {d.options?.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)", marginBottom: "6px" }}>Options</p>
                  {(d.options ?? []).map((opt: any, i: number) => (
                    <div key={i} style={{ padding: "6px 10px", background: opt.isCorrect ? "rgba(34,197,94,0.06)" : "var(--color-bg-secondary)", border: `1px solid ${opt.isCorrect ? "rgba(34,197,94,0.25)" : "var(--color-border)"}`, borderRadius: "var(--radius-sm)", marginBottom: "4px", fontSize: "13px", color: "var(--color-text-primary)" }}>
                      {opt.isCorrect ? "✓ " : ""}{opt.text}
                    </div>
                  ))}
                </div>
              )}
              <Sec title="Explanation" content={d.explanation} />
            </>
          )}

          {/* Reviewer action mockup */}
          {["CAREER", "PATHWAY", "BURSARY", "QUESTION"].includes(item.type) && (
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "16px", marginTop: "8px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)", marginBottom: "10px" }}>Reviewer actions (preview)</p>
              <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                {[1,2,3,4,5].map((n) => <div key={n} style={{ width: "34px", height: "34px", borderRadius: "50%", border: "2px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)" }}>{n}</div>)}
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)", alignSelf: "center", marginLeft: "4px" }}>Confidence rating</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1, padding: "8px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "var(--radius-sm)", textAlign: "center", fontSize: "13px", fontWeight: 700, color: "#22c55e" }}>Approve</div>
                <div style={{ flex: 1, padding: "8px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", textAlign: "center", fontSize: "13px", fontWeight: 700, color: "#ef4444" }}>Reject</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Assign modal ──────────────────────────────────────────────────────────────

function AssignModal({ item, onClose, onAssigned }: { item: QueueItem; onClose: () => void; onAssigned: () => void }) {
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [reviewerId, setReviewerId] = useState(item.review?.reviewer?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isReassign = !!item.review;

  useEffect(() => {
    apiClient.get("/admin/staff", { params: { role: "REVIEWER", limit: 100 } })
      .then((r) => setReviewers(r.data.data?.users ?? r.data.data ?? []))
      .catch(() => {});
  }, []);

  const assign = async () => {
    if (!reviewerId) { setError("Select a reviewer"); return; }
    setSaving(true); setError("");
    try {
      const contentTypeMap: Record<string, string> = {
        CAREER: "CAREER", PATHWAY: "PATHWAY", BURSARY: "BURSARY",
        QUESTION: "ASSESSMENT_QUESTION",
        TVET: "TVET_COLLEGE", PRIVATE: "TVET_COLLEGE",
      };
      const contentType = contentTypeMap[item.type] ?? item.type;

      await apiClient.post("/content/reviews", {
        contentType,
        careerId:    item.type === "CAREER"                   ? item.data.id : undefined,
        questionId:  item.type === "QUESTION"                 ? item.data.id : undefined,
        entityId:    !["CAREER", "QUESTION"].includes(item.type) ? item.data.id : undefined,
        reviewerId,
      });

      if (item.type === "CAREER") {
        await apiClient.patch(`/careers/${item.data.id}`, { status: "IN_REVIEW" });
      }
      if (item.type === "PATHWAY") {
        await apiClient.patch(`/pathways/${item.data.id}`, { status: "IN_REVIEW" });
      }

      onAssigned();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to assign");
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "420px", maxWidth: "92vw", background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-lg)", padding: "28px", zIndex: 60, boxShadow: "0 12px 48px rgba(0,0,0,0.22)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <TypeBadge type={item.type} />
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {isReassign ? "Reassign reviewer" : "Assign for review"}
          </h3>
        </div>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "20px" }}>{item.label}</p>

        {error && <div style={{ padding: "8px 12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#ef4444", marginBottom: "12px" }}>{error}</div>}

        {reviewers.length === 0 ? (
          <div style={{ padding: "14px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "var(--radius-sm)", marginBottom: "16px" }}>
            <p style={{ fontSize: "13px", color: "#d97706" }}>No active reviewers yet — invite reviewers from the <strong>Reviewers</strong> page first.</p>
          </div>
        ) : (
          <div style={{ marginBottom: "22px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px" }}>Reviewer *</label>
            <Select value={reviewerId} onChange={setReviewerId} options={[{ label: "Select a reviewer…", value: "" }, ...reviewers.map((r) => ({ label: displayName(r) || r.email, value: r.id }))]} />
            {reviewerId && reviewers.find(r => r.id === reviewerId)?.specialisation && (
              <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "5px" }}>
                🏷 {reviewers.find(r => r.id === reviewerId)?.specialisation}
              </p>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <Btn label="Cancel" onClick={onClose} variant="ghost" />
          {reviewers.length > 0 && <Btn label={saving ? "Saving…" : isReassign ? "Reassign" : "Assign reviewer"} onClick={assign} />}
        </div>
      </div>
    </>
  );
}

// ── Bulk assign bar ───────────────────────────────────────────────────────────

function BulkAssignBar({
  selected,
  items,
  onClear,
  onAssigned,
}: {
  selected: Set<string>;
  items: QueueItem[];
  onClear: () => void;
  onAssigned: () => void;
}) {
  const [reviewers,   setReviewers]   = useState<any[]>([]);
  const [reviewerId,  setReviewerId]  = useState("");
  const [saving,      setSaving]      = useState(false);
  const [result,      setResult]      = useState("");

  useEffect(() => {
    apiClient.get("/admin/staff", { params: { role: "REVIEWER", limit: 100 } })
      .then((r) => setReviewers(r.data?.data?.users ?? []))
      .catch(() => {});
  }, []);

  const selectedItems = items.filter((i) => selected.has(`${i.type}-${i.id}`));
  const unassigned    = selectedItems.filter((i) => !i.review);
  const count         = unassigned.length;

  const assign = async () => {
    if (!reviewerId || count === 0) return;
    setSaving(true);
    setResult("");
    try {
      // Group by type so we can build the right payload for each
      const byType = new Map<string, QueueItem[]>();
      unassigned.forEach((item) => {
        if (!byType.has(item.type)) byType.set(item.type, []);
        byType.get(item.type)!.push(item);
      });

      for (const [type, typeItems] of byType) {
        const ids = typeItems.map((i) => i.id);
        let payload: any = { reviewerId };

        if (type === "CAREER")   payload = { ...payload, contentType: "CAREER",   careerIds: ids };
        else if (type === "PATHWAY")  payload = { ...payload, contentType: "PATHWAY",  pathwayIds: ids };
        else if (type === "BURSARY")  payload = { ...payload, contentType: "BURSARY",  bursaryIds: ids };
        else if (type === "TVET")     payload = { ...payload, contentType: "TVET_COLLEGE", collegeIds: ids };
        else if (type === "PRIVATE")  payload = { ...payload, contentType: "TVET_COLLEGE", collegeIds: ids };
        else if (type === "QUESTION") payload = { ...payload, contentType: "ASSESSMENT_QUESTION", questionIds: ids };

        await apiClient.post("/content/reviews/bulk", payload);
      }

      setResult(`✓ Assigned ${count} item${count !== 1 ? "s" : ""}`);
      setTimeout(() => { onAssigned(); onClear(); }, 1200);
    } catch (err: any) {
      setResult("Error: " + (err?.response?.data?.message ?? err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "sticky", bottom: "16px", zIndex: 30,
      background: "var(--color-card-bg)", border: "2px solid var(--color-accent)",
      borderRadius: "var(--radius)", padding: "12px 16px",
      boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
      display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "0 0 auto" }}>
        <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--color-accent)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800 }}>
          {selected.size}
        </span>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
          selected · {count} need{count === 1 ? "s" : ""} assignment
        </span>
      </div>

      <div style={{ flex: 1, minWidth: "160px" }}>
        <Select
          value={reviewerId}
          onChange={setReviewerId}
          options={[{ label: "Select reviewer…", value: "" }, ...reviewers.map((r) => ({ label: displayName(r) || r.email, value: r.id }))]}
        />
      </div>

      {result ? (
        <span style={{ fontSize: "12px", fontWeight: 600, color: result.startsWith("✓") ? "#22c55e" : "#ef4444" }}>{result}</span>
      ) : (
        <Btn
          label={saving ? "Assigning…" : `Assign ${count} item${count !== 1 ? "s" : ""} →`}
          onClick={assign}
        />
      )}

      <button
        onClick={onClear}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "var(--color-text-muted)", lineHeight: 1, marginLeft: "auto" }}
        title="Clear selection"
      >×</button>
    </div>
  );
}

// ── Queue item type ───────────────────────────────────────────────────────────

interface QueueItem {
  id: string;
  type: string;       // CAREER | PATHWAY | BURSARY | TVET | PRIVATE | QUESTION
  label: string;      // display title
  sub?: string;       // subtitle (cluster, province, etc.)
  data: any;          // raw API object
  review: any | null; // ContentReview with reviewer, if any
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AdminReviewQueuePage() {
  const [items, setItems]           = useState<QueueItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [assignItem, setAssignItem] = useState<QueueItem | null>(null);
  const [previewItem, setPreviewItem] = useState<QueueItem | null>(null);
  const [selected, setSelected]     = useState<Set<string>>(new Set());

  const toggleSelect = (key: string) =>
    setSelected((prev) => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });

  const toggleAll = () => {
    const keys = filtered.map((i) => `${i.type}-${i.id}`);
    const allSelected = keys.every((k) => selected.has(k));
    setSelected(allSelected ? new Set() : new Set(keys));
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch everything in parallel
      const [
        careersAI, careersReview,
        pathwaysRes,
        bursariesRes,
        tvetRes,
        privateRes,
        questionsRes,
        reviewsRes,
      ] = await Promise.allSettled([
        apiClient.get("/careers",             { params: { status: "AI_GENERATED", limit: 200 } }),
        apiClient.get("/careers",             { params: { status: "IN_REVIEW",    limit: 200 } }),
        apiClient.get("/pathways",            { params: { status: "AI_GENERATED", limit: 200 } }),
        apiClient.get("/bursaries",           { params: { status: "AI_GENERATED", limit: 200 } }),
        apiClient.get("/tvet",                { params: { status: "IN_REVIEW", collegeType: "PUBLIC",   limit: 200 } }),
        apiClient.get("/tvet",                { params: { status: "IN_REVIEW", collegeType: "PRIVATE",  limit: 200 } }),
        apiClient.get("/assessments/questions", { params: { status: "AI_GENERATED", limit: 200 } }),
        apiClient.get("/content/reviews",     { params: { limit: 500 } }),
      ]);

      const get = (r: PromiseSettledResult<any>, path: string): any[] => {
        if (r.status !== "fulfilled") return [];
        const d = r.value.data?.data;
        return path.split(".").reduce((o, k) => o?.[k] ?? [], d) as any[];
      };

      // Build entity-id → review map (covers careers, questions, and generic entityId)
      const reviews: any[] = get(reviewsRes, "reviews");
      const reviewMap = new Map<string, any>();
      reviews.forEach((rv) => {
        if (rv.careerId)   reviewMap.set(rv.careerId,   rv);
        if (rv.questionId) reviewMap.set(rv.questionId, rv);
        if (rv.entityId)   reviewMap.set(rv.entityId,   rv);
      });

      // Merge all careers (dedup)
      const careerMap = new Map<string, any>();
      [...get(careersAI, "careers"), ...get(careersReview, "careers")].forEach((c) => careerMap.set(c.id, c));
      const careers = Array.from(careerMap.values());

      const pathways  = get(pathwaysRes,  "pathways");
      const bursaries = get(bursariesRes, "bursaries");
      const tvets     = get(tvetRes,      "colleges");
      const privates  = get(privateRes,   "colleges");
      const questions = get(questionsRes, "questions");

      const queue: QueueItem[] = [
        ...careers.map((c) => ({
          id: c.id, type: "CAREER",
          label: c.title ?? "Untitled career",
          sub: c.cluster?.name,
          data: c,
          review: reviewMap.get(c.id) ?? null,
        })),
        ...pathways.map((p) => ({
          id: p.id, type: "PATHWAY",
          label: p.title ?? p.career?.title ?? "Pathway",
          sub: p.pathwayType,
          data: p,
          review: reviewMap.get(p.id) ?? null,
        })),
        ...bursaries.map((b) => ({
          id: b.id, type: "BURSARY",
          label: b.name ?? "Bursary",
          sub: b.provider,
          data: b,
          review: reviewMap.get(b.id) ?? null,
        })),
        ...tvets.map((t) => ({
          id: t.id, type: "TVET",
          label: t.name,
          sub: t.province,
          data: t,
          review: reviewMap.get(t.id) ?? null,
        })),
        ...privates.map((t) => ({
          id: t.id, type: "PRIVATE",
          label: t.name,
          sub: t.province,
          data: t,
          review: reviewMap.get(t.id) ?? null,
        })),
        ...questions.map((q) => ({
          id: q.id, type: "QUESTION",
          label: q.questionText?.slice(0, 80) ?? "Question",
          sub: q.assessmentType,
          data: q,
          review: reviewMap.get(q.id) ?? null,
        })),
      ];

      setItems(queue);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Counts per type
  const counts: Record<string, number> = {};
  items.forEach((i) => { counts[i.type] = (counts[i.type] ?? 0) + 1; });

  const filtered = typeFilter ? items.filter((i) => i.type === typeFilter) : items;

  const unassigned  = items.filter((i) => !i.review).length;
  const inReview    = items.filter((i) => i.review && ["PENDING", "IN_PROGRESS"].includes(i.review?.status)).length;
  const approved    = items.filter((i) => i.review?.status === "APPROVED").length;
  const needsVerify = 0; // placeholder — driven by verified count once colleges support reviews
  const overdue    = items.filter((i) => i.review?.dueAt && new Date(i.review.dueAt) < new Date() && i.review.status === "PENDING");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Review Queue"
        subtitle="Every piece of content — AI-generated or manual — must be reviewed before learners see it"
      />

      {overdue.length > 0 && (
        <div style={{ padding: "10px 16px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#ef4444" }}>
          ⚠️ {overdue.length} review{overdue.length > 1 ? "s are" : " is"} overdue — follow up with reviewers
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: "12px" }}>
        <StatCard label="Needs assignment" value={unassigned} accent="#94a3b8" />
        <StatCard label="In review"        value={inReview}  accent="#f59e0b" />
        <StatCard label="Approved"         value={approved}  accent="#3b82f6" />
        <StatCard label="Total items"      value={items.length} accent="#6366f1" />
      </div>

      {/* Tag filter + refresh */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <TagFilter active={typeFilter} onChange={setTypeFilter} counts={counts} />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
          <Btn label="Refresh" onClick={load} variant="ghost" small />
        </div>
      </div>

      {/* Table */}
      <Card noPad>
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <Empty message={typeFilter ? `No ${TYPE_CONFIG[typeFilter]?.label ?? typeFilter} items need review` : "Nothing needs review right now — generate content from AI Pipeline"} />
        ) : (
          <Table headers={[
            // Checkbox header — select all
            <input
              type="checkbox"
              checked={filtered.length > 0 && filtered.every((i) => selected.has(`${i.type}-${i.id}`))}
              onChange={toggleAll}
              style={{ cursor: "pointer", width: "15px", height: "15px", accentColor: "var(--color-accent)" }}
            />,
            "Type", "Title", "Topic / Province", "Status", "Reviewer", "",
          ]}>
            {filtered.map((item) => {
              const key = `${item.type}-${item.id}`;
              const isSelected = selected.has(key);
              const isOverdue = item.review?.dueAt && new Date(item.review.dueAt) < new Date() && item.review.status === "PENDING";

              return (
                <TableRow
                  key={key}
                  cols={[
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(key)}
                      style={{ cursor: "pointer", width: "15px", height: "15px", accentColor: "var(--color-accent)" }}
                    />,

                    <TypeBadge type={item.type} />,

                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.3 }}>{item.label}</p>
                      {item.sub && <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "1px" }}>{item.sub}</p>}
                    </div>,

                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{item.sub ?? "—"}</span>,

                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      {statusBadge(item.data.status)}
                      {isOverdue && <span style={{ fontSize: "10px", color: "#ef4444", fontWeight: 600 }}>⚠️ overdue</span>}
                    </div>,

                    // Reviewer column — same for ALL content types
                    item.review?.reviewer ? (
                      <ReviewerChip reviewer={item.review.reviewer} onReassign={() => setAssignItem(item)} />
                    ) : (
                      <Btn label="Assign →" onClick={() => setAssignItem(item)} small />
                    ),

                    <Btn label="Preview" onClick={() => setPreviewItem(item)} variant="ghost" small />,
                  ]}
                />
              );
            })}
          </Table>
        )}
      </Card>

      {/* Bulk assign bar — floats at bottom when items selected */}
      {selected.size > 0 && (
        <BulkAssignBar
          selected={selected}
          items={items}
          onClear={() => setSelected(new Set())}
          onAssigned={() => { setSelected(new Set()); load(); }}
        />
      )}

      {previewItem && <PreviewPanel item={previewItem} onClose={() => setPreviewItem(null)} onUpdated={load} />}
      {assignItem  && <AssignModal  item={assignItem}  onClose={() => setAssignItem(null)} onAssigned={() => { setAssignItem(null); load(); }} />}
    </div>
  );
}
