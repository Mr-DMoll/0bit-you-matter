"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, StatCard, Table, TableRow, statusBadge,
  Spinner, Empty, SearchInput, Select, Pagination, Btn, Badge,
} from "../components/AdminShell";

// ── Career detail panel ───────────────────────────────────────────────────────

function InlineInput({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "7px 10px", fontSize: "13px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }} />
  );
}
function InlineTextarea({ value, onChange, placeholder, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width: "100%", padding: "7px 10px", fontSize: "13px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
  );
}

// ── Review status indicator (for table rows) ──────────────────────────────────
function ReviewIndicator({ status }: { status: string }) {
  if (status === "AI_GENERATED") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "999px", background: "rgba(245,158,11,0.12)", color: "#d97706", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap" }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#d97706", flexShrink: 0 }} />
      Needs review
    </span>
  );
  if (status === "IN_REVIEW") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "999px", background: "rgba(59,130,246,0.12)", color: "#3b82f6", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap" }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#3b82f6", flexShrink: 0 }} />
      In review
    </span>
  );
  if (status === "APPROVED") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "999px", background: "rgba(99,102,241,0.12)", color: "#6366f1", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap" }}>
      ✓ Approved
    </span>
  );
  if (status === "VERIFIED") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "999px", background: "rgba(34,197,94,0.12)", color: "#16a34a", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap" }}>
      ✓ Verified
    </span>
  );
  return <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>—</span>;
}

function CareerPanel({ career, clusters, onClose, onAssigned, onUpdated, onDeleted }: { career: any; clusters: any[]; onClose: () => void; onAssigned: () => void; onUpdated: () => void; onDeleted: () => void }) {
  const [reviewers, setReviewers]   = useState<any[]>([]);
  const [reviewerId, setReviewerId] = useState("");
  const [dueAt, setDueAt]           = useState("");
  const [assigning, setAssigning]   = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [assignError, setAssignError]     = useState("");
  const [reviews, setReviews]       = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    title:        career.title ?? "",
    clusterId:    career.clusterId ?? "",
    overview:     career.overview ?? "",
    dayInTheLife: career.dayInTheLife ?? "",
    howToGetThere:career.howToGetThere ?? "",
    earningsMin:  String(career.earningsMin ?? ""),
    earningsMax:  String(career.earningsMax ?? ""),
    earningsNote: career.earningsNote ?? "",
    nqfLevelMin:  String(career.nqfLevelMin ?? ""),
    riasecCodes:  (career.riasecCodes ?? []).join(", "),
    saContext:    career.saContext ?? "",
  });
  const [saving, setSaving]   = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    apiClient.get("/admin/users", { params: { role: "REVIEWER", status: "ACTIVE" } })
      .then((r) => setReviewers(r.data.data?.users ?? r.data.data ?? []))
      .catch(() => {});
    // Load review history for this career
    setReviewsLoading(true);
    apiClient.get("/content/reviews", { params: { careerId: career.id, limit: 20 } })
      .then((r) => setReviews(r.data.data?.reviews ?? r.data.data ?? []))
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [career.id]);

  const saveEdit = async () => {
    setSaving(true); setSaveError("");
    try {
      const payload: any = {
        ...editForm,
        earningsMin:  editForm.earningsMin  ? parseInt(editForm.earningsMin)  : undefined,
        earningsMax:  editForm.earningsMax  ? parseInt(editForm.earningsMax)  : undefined,
        nqfLevelMin:  editForm.nqfLevelMin  ? parseInt(editForm.nqfLevelMin)  : undefined,
        riasecCodes:  editForm.riasecCodes.split(",").map((s: string) => s.trim()).filter(Boolean),
      };
      await apiClient.patch(`/careers/${career.id}`, payload);
      setEditMode(false);
      onUpdated();
    } catch (e: any) { setSaveError(e?.response?.data?.message ?? "Save failed"); }
    setSaving(false);
  };

  const archiveCareer = async () => {
    if (!confirm(`Archive "${career.title}"? It will be hidden from learners.`)) return;
    try {
      await apiClient.patch(`/careers/${career.id}`, { status: "ARCHIVED" });
      onDeleted();
    } catch {}
  };

  const assign = async () => {
    if (!reviewerId) { setAssignError("Please select a reviewer"); return; }
    setAssigning(true); setAssignError("");
    try {
      await apiClient.post("/content/reviews", {
        contentType: "CAREER",
        careerId:    career.id,
        reviewerId,
        dueAt:       dueAt || undefined,
      });
      // Move career to IN_REVIEW status
      await apiClient.patch(`/careers/${career.id}`, { status: "IN_REVIEW" });
      setAssignSuccess(true);
      onAssigned();
      setTimeout(() => setAssignSuccess(false), 4000);
    } catch (e: any) {
      setAssignError(e?.response?.data?.message ?? "Failed to assign review");
    } finally {
      setAssigning(false);
    }
  };

  const Section = ({ title, content }: { title: string; content?: string | null }) => {
    if (!content) return null;
    return (
      <div style={{ marginBottom: "20px" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>{title}</p>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{content}</p>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 40 }} />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "520px", maxWidth: "90vw",
        background: "var(--color-card-bg)", borderLeft: "1px solid var(--color-card-border)",
        zIndex: 50, overflowY: "auto", display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", position: "sticky", top: 0, background: "var(--color-card-bg)", zIndex: 1 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              {statusBadge(career.status)}
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{career.cluster?.name}</span>
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)" }}>{career.title}</h2>
            {career.riasecCodes?.length > 0 && (
              <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
                {career.riasecCodes.map((c: string) => (
                  <span key={c} style={{ padding: "2px 8px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "4px", fontSize: "11px", fontWeight: 700, color: "var(--color-accent)" }}>{c}</span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button onClick={() => setEditMode(!editMode)} style={{ padding: "4px 10px", fontSize: "12px", background: editMode ? "var(--color-accent)" : "none", color: editMode ? "#fff" : "var(--color-text-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>{editMode ? "Cancel" : "Edit"}</button>
            <button onClick={archiveCareer} style={{ padding: "4px 10px", fontSize: "12px", background: "none", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>Archive</button>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--color-text-muted)", lineHeight: 1, padding: "2px", flexShrink: 0 }}>×</button>
          </div>
        </div>

        <div style={{ padding: "20px 24px", flex: 1 }}>
          {/* Edit form */}
          {editMode && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              {saveError && <div style={{ padding: "8px 12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#ef4444" }}>{saveError}</div>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "5px" }}>Title</label>
                  <InlineInput value={editForm.title} onChange={(v) => setEditForm({ ...editForm, title: v })} placeholder="Career title" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "5px" }}>Cluster</label>
                  <Select value={editForm.clusterId} onChange={(v) => setEditForm({ ...editForm, clusterId: v })}
                    options={clusters.map((c) => ({ label: c.name, value: c.id }))} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "5px" }}>Earnings min (ZAR/yr)</label>
                  <InlineInput value={editForm.earningsMin} onChange={(v) => setEditForm({ ...editForm, earningsMin: v })} type="number" placeholder="180000" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "5px" }}>Earnings max (ZAR/yr)</label>
                  <InlineInput value={editForm.earningsMax} onChange={(v) => setEditForm({ ...editForm, earningsMax: v })} type="number" placeholder="600000" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "5px" }}>NQF level min</label>
                  <InlineInput value={editForm.nqfLevelMin} onChange={(v) => setEditForm({ ...editForm, nqfLevelMin: v })} type="number" placeholder="7" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "5px" }}>RIASEC codes (comma-separated)</label>
                  <InlineInput value={editForm.riasecCodes} onChange={(v) => setEditForm({ ...editForm, riasecCodes: v })} placeholder="R, I, A" />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "5px" }}>Earnings note</label>
                <InlineInput value={editForm.earningsNote} onChange={(v) => setEditForm({ ...editForm, earningsNote: v })} placeholder="Varies by experience and sector" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "5px" }}>Overview</label>
                <InlineTextarea value={editForm.overview} onChange={(v) => setEditForm({ ...editForm, overview: v })} rows={5} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "5px" }}>Day in the life</label>
                <InlineTextarea value={editForm.dayInTheLife} onChange={(v) => setEditForm({ ...editForm, dayInTheLife: v })} rows={4} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "5px" }}>How to get there</label>
                <InlineTextarea value={editForm.howToGetThere} onChange={(v) => setEditForm({ ...editForm, howToGetThere: v })} rows={4} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "5px" }}>SA Context</label>
                <InlineTextarea value={editForm.saContext} onChange={(v) => setEditForm({ ...editForm, saContext: v })} rows={3} placeholder="South African market context, demand, sector notes…" />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <Btn label={saving ? "Saving…" : "Save changes"} onClick={saveEdit} />
                <Btn label="Cancel" onClick={() => setEditMode(false)} variant="ghost" />
              </div>
            </div>
          )}

          {/* Read view */}
          {!editMode && <>
          {/* Earnings + NQF */}
          {(career.earningsMin || career.nqfLevelMin) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              {career.earningsMin && (
                <div style={{ padding: "12px 14px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Salary range (ZAR/yr)</p>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "2px" }}>
                    R{(career.earningsMin / 1000).toFixed(0)}k – R{(career.earningsMax / 1000).toFixed(0)}k
                  </p>
                  {career.earningsNote && <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>{career.earningsNote}</p>}
                </div>
              )}
              {career.nqfLevelMin && (
                <div style={{ padding: "12px 14px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Min NQF level</p>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "2px" }}>NQF {career.nqfLevelMin}</p>
                </div>
              )}
            </div>
          )}

          <Section title="Overview"          content={career.overview} />
          <Section title="Day in the life"   content={career.dayInTheLife} />
          <Section title="How to get there"  content={career.howToGetThere} />
          {career.saContext && <Section title="SA Context" content={career.saContext} />}

          {/* Assign for review */}
          {career.status === "AI_GENERATED" && (
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "20px", marginTop: "4px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "12px" }}>Assign for review</p>

              {assignSuccess && (
                <div style={{ padding: "10px 14px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#22c55e", marginBottom: "12px" }}>
                  ✓ Assigned to reviewer successfully
                </div>
              )}
              {assignError && (
                <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#ef4444", marginBottom: "12px" }}>
                  {assignError}
                </div>
              )}

              {reviewers.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                  No reviewers in the system yet — invite a reviewer first from the Reviewers page.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "6px" }}>Reviewer *</label>
                    <Select
                      value={reviewerId}
                      onChange={setReviewerId}
                      options={[
                        { label: "Select a reviewer…", value: "" },
                        ...reviewers.map((r) => ({ label: r.displayName ?? r.email, value: r.id })),
                      ]}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "6px" }}>Due date (optional)</label>
                    <input
                      type="date"
                      value={dueAt}
                      onChange={(e) => setDueAt(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", fontSize: "13px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <Btn label={assigning ? "Assigning…" : "Assign for review"} onClick={assign} />
                </div>
              )}
            </div>
          )}

          {/* ── Review history ──────────────────────────────────────────── */}
          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "20px", marginTop: "8px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>Review history</p>

            {reviewsLoading ? (
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Loading…</p>
            ) : reviews.length === 0 ? (
              <div style={{ padding: "12px 14px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "var(--radius-sm)" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#d97706", marginBottom: "2px" }}>No reviews yet</p>
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>This career was AI-generated and has not been assigned for review. Use the panel above to assign a reviewer.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {reviews.map((r: any, i: number) => {
                  const isApproved = r.status === "APPROVED";
                  const isRejected = r.status === "REJECTED";
                  const isPending  = r.status === "PENDING" || r.status === "IN_PROGRESS";
                  const dotColor   = isApproved ? "#22c55e" : isRejected ? "#ef4444" : "#3b82f6";
                  const bgColor    = isApproved ? "rgba(34,197,94,0.06)" : isRejected ? "rgba(239,68,68,0.06)" : "rgba(59,130,246,0.06)";
                  const borderColor = isApproved ? "rgba(34,197,94,0.2)" : isRejected ? "rgba(239,68,68,0.2)" : "rgba(59,130,246,0.2)";
                  const reviewer   = r.reviewer;
                  const name       = reviewer?.displayName ?? reviewer?.firstName ? `${reviewer.firstName} ${reviewer.lastName ?? ""}`.trim() : reviewer?.email ?? "Unknown reviewer";

                  return (
                    <div key={r.id} style={{ padding: "12px 14px", background: bgColor, border: `1px solid ${borderColor}`, borderRadius: "var(--radius-sm)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{name}</span>
                          <span style={{ fontSize: "11px", padding: "1px 7px", borderRadius: "999px", background: dotColor + "20", color: dotColor, fontWeight: 700 }}>
                            {isPending ? "In progress" : r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                          </span>
                        </div>
                        <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                          {r.completedAt ? new Date(r.completedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
                            : r.dueAt ? `Due ${new Date(r.dueAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}` : ""}
                        </span>
                      </div>
                      {reviewer?.email && (
                        <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: r.notes ? "6px" : 0 }}>{reviewer.email}</p>
                      )}
                      {r.notes && (
                        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.6, fontStyle: "italic", borderLeft: `2px solid ${dotColor}`, paddingLeft: "8px", marginTop: "6px" }}>
                          "{r.notes}"
                        </p>
                      )}
                      {r.confidenceRating && (
                        <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>Confidence: {r.confidenceRating}/5</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </>}
        </div>
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AdminCareersLibraryPage() {
  const [careers, setCareers]       = useState<any[]>([]);
  const [clusters, setClusters]     = useState<any[]>([]);
  const [coverage, setCoverage]     = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [status, setStatus]         = useState("");
  const [clusterId, setClusterId]   = useState("");
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState<any | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params: any = { page };
    if (status)    params.status    = status;
    if (clusterId) params.clusterId = clusterId;
    if (search)    params.search    = search;
    Promise.all([
      apiClient.get("/careers", { params }),
      apiClient.get("/careers/clusters"),
      apiClient.get("/careers/stats/coverage"),
    ])
      .then(([c, cl, cv]) => {
        setCareers(c.data.data.careers);
        setPagination(c.data.data.pagination);
        setClusters(cl.data.data);
        setCoverage(cv.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, status, clusterId, search]);

  useEffect(() => { load(); }, [load]);

  const totalVerified = coverage.reduce((s, c) => s + c.verified, 0);
  const totalApproved = coverage.reduce((s, c) => s + c.approved, 0);
  const totalAI       = coverage.reduce((s, c) => s + c.aiGenerated, 0);

  const clusterOptions = [
    { label: "All clusters", value: "" },
    ...clusters.map((c: any) => ({ label: c.name, value: c.id })),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader title="Careers Library" subtitle={`${pagination.total} careers in the database`} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
        <StatCard label="Total"    value={pagination.total} />
        <StatCard label="Verified" value={totalVerified} accent="#22c55e" />
        <StatCard label="Approved" value={totalApproved} accent="#3b82f6" />
        <StatCard label="AI Draft" value={totalAI}       accent="#94a3b8" />
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search careers…" />
        <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[
          { label: "All statuses",  value: "" },
          { label: "AI Generated",  value: "AI_GENERATED" },
          { label: "In Review",     value: "IN_REVIEW" },
          { label: "Approved",      value: "APPROVED" },
          { label: "Verified",      value: "VERIFIED" },
          { label: "Archived",      value: "ARCHIVED" },
        ]} />
        <Select value={clusterId} onChange={(v) => { setClusterId(v); setPage(1); }} options={clusterOptions} />
      </div>

      <Card noPad>
        {loading ? <Spinner /> : careers.length === 0 ? <Empty message="No careers found" /> : (
          <Table headers={["Title", "Cluster", "RIASEC", "Status", "Review", ""]}>
            {careers.map((c) => (
              <TableRow
                key={c.id}
                cols={[
                  <span style={{ fontWeight: 500, color: "var(--color-text-primary)", cursor: "pointer" }} onClick={() => setSelected(c)}>{c.title}</span>,
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{c.cluster?.name ?? "—"}</span>,
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>{c.riasecCodes?.join(" ") || "—"}</span>,
                  statusBadge(c.status),
                  <ReviewIndicator status={c.status} />,
                  <button
                    onClick={() => setSelected(c)}
                    style={{ background: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "4px 10px", fontSize: "12px", color: "var(--color-text-muted)", cursor: "pointer" }}
                  >
                    View →
                  </button>,
                ]}
              />
            ))}
          </Table>
        )}
        <Pagination page={page} pages={pagination.pages} onPage={setPage} />
      </Card>

      {coverage.length > 0 && (
        <Card title="Coverage by Cluster">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
            {coverage.map((c) => (
              <div key={c.id} style={{ padding: "12px 14px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "4px" }}>{c.name}</p>
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{c.total} careers · {c.verified} verified</p>
                <div style={{ marginTop: "6px", height: "4px", background: "var(--color-border)", borderRadius: "2px" }}>
                  <div style={{ height: "100%", width: `${c.total ? Math.round((c.verified / c.total) * 100) : 0}%`, background: "#22c55e", borderRadius: "2px", transition: "width 0.3s" }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {selected && (
        <CareerPanel
          career={selected}
          clusters={clusters}
          onClose={() => setSelected(null)}
          onAssigned={() => { load(); setSelected(null); }}
          onUpdated={() => { load(); setSelected(null); }}
          onDeleted={() => { load(); setSelected(null); }}
        />
      )}
    </div>
  );
}
