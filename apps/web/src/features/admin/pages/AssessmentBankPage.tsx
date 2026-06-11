"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, StatCard, Table, TableRow, statusBadge,
  Spinner, Empty, Select, Pagination, Btn, displayName, timeAgo,
} from "../components/AdminShell";

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<string, { label: string; color: string; bg: string; description: string }> = {
  INTEREST:    { label: "Interest",    color: "#6366f1", bg: "rgba(99,102,241,0.1)",   description: "Identifies what learners enjoy doing — maps to RIASEC codes" },
  APTITUDE:    { label: "Aptitude",    color: "#3b82f6", bg: "rgba(59,130,246,0.1)",   description: "Tests natural strengths: numerical, verbal, spatial, logical" },
  PERSONALITY: { label: "Personality", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",  description: "Work-style preferences — structured vs. creative, solo vs. team" },
  VALUES:      { label: "Values",      color: "#f59e0b", bg: "rgba(245,158,11,0.1)",   description: "What matters most in a career — income, impact, flexibility, status" },
};

const RIASEC_CFG: Record<string, { label: string; color: string }> = {
  R: { label: "Realistic",       color: "#22c55e" },
  I: { label: "Investigative",   color: "#3b82f6" },
  A: { label: "Artistic",        color: "#ec4899" },
  S: { label: "Social",          color: "#f59e0b" },
  E: { label: "Enterprising",    color: "#ef4444" },
  C: { label: "Conventional",    color: "#6366f1" },
};

// ── Small components ──────────────────────────────────────────────────────────

function TypeTag({ type, active, count, onClick }: { type: string; active: boolean; count: number; onClick: () => void }) {
  const cfg = TYPE_CFG[type];
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "6px 14px", borderRadius: "999px", cursor: "pointer",
      fontSize: "12px", fontWeight: active ? 700 : 500,
      border: active ? `2px solid ${cfg.color}` : "1px solid var(--color-border)",
      background: active ? cfg.bg : "var(--color-card-bg)",
      color: active ? cfg.color : "var(--color-text-muted)",
      transition: "all 0.12s",
    }}>
      {cfg.label}
      <span style={{ fontSize: "10px", fontWeight: 700, minWidth: "16px", height: "16px", borderRadius: "999px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: active ? cfg.color : "var(--color-bg-secondary)", color: active ? "#fff" : "var(--color-text-muted)", padding: "0 4px" }}>
        {count}
      </span>
    </button>
  );
}

function ReviewStatusPill({ status }: { status: string }) {
  if (status === "AI_GENERATED") return <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", background: "rgba(245,158,11,0.1)", color: "#d97706", border: "1px solid rgba(245,158,11,0.25)", fontWeight: 600 }}>Needs review</span>;
  if (status === "IN_REVIEW")    return <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", background: "rgba(59,130,246,0.1)",  color: "#3b82f6", border: "1px solid rgba(59,130,246,0.25)",  fontWeight: 600 }}>In review</span>;
  if (status === "APPROVED")     return <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", background: "rgba(139,92,246,0.1)",  color: "#7c3aed", border: "1px solid rgba(139,92,246,0.25)",  fontWeight: 600 }}>✓ Approved</span>;
  if (status === "VERIFIED")     return <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", background: "rgba(34,197,94,0.1)",   color: "#16a34a", border: "1px solid rgba(34,197,94,0.25)",   fontWeight: 600 }}>✓ Verified</span>;
  return <span>—</span>;
}

// ── Bulk assign modal ─────────────────────────────────────────────────────────

function BulkAssignModal({
  assessmentType,
  unassignedCount,
  onClose,
  onAssigned,
}: {
  assessmentType: string;
  unassignedCount: number;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const cfg = TYPE_CFG[assessmentType];
  const [reviewers, setReviewers]   = useState<any[]>([]);
  const [reviewerId, setReviewerId] = useState("");
  const [dueAt, setDueAt]           = useState("");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  useEffect(() => {
    apiClient.get("/admin/users", { params: { role: "REVIEWER", status: "ACTIVE" } })
      .then((r) => setReviewers(r.data.data?.users ?? r.data.data ?? []))
      .catch(() => {});
  }, []);

  const assign = async () => {
    if (!reviewerId) { setError("Select a reviewer"); return; }
    setSaving(true); setError("");
    try {
      const res = await apiClient.post("/content/reviews/bulk", {
        contentType:    "ASSESSMENT_QUESTION",
        assessmentType,
        reviewerId,
        dueAt: dueAt || undefined,
      });
      const { assigned, reviewerName } = res.data.data;
      setSuccess(`✓ ${assigned} questions assigned to ${reviewerName}`);
      setTimeout(() => { onAssigned(); onClose(); }, 1400);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to assign");
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "440px", maxWidth: "92vw", background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-lg)", padding: "28px", zIndex: 60, boxShadow: "0 12px 48px rgba(0,0,0,0.22)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-sm)", background: cfg.bg, border: `1px solid ${cfg.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
            📋
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              Bulk assign — {cfg.label}
            </h3>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
              Assign all {unassignedCount} unreviewed {cfg.label.toLowerCase()} questions to one reviewer
            </p>
          </div>
        </div>

        {/* Count badge */}
        <div style={{ padding: "12px 14px", background: cfg.bg, border: `1px solid ${cfg.color}22`, borderRadius: "var(--radius-sm)", marginBottom: "20px", marginTop: "12px" }}>
          <p style={{ fontSize: "13px", color: cfg.color, fontWeight: 600 }}>
            {unassignedCount} question{unassignedCount !== 1 ? "s" : ""} will be assigned
          </p>
          <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
            The reviewer will see all of them in their queue at once. They review each question, confirm the wording and RIASEC mapping is accurate, and approve or suggest edits.
          </p>
        </div>

        {error && <div style={{ padding: "8px 12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#ef4444", marginBottom: "12px" }}>{error}</div>}
        {success && <div style={{ padding: "10px 12px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#16a34a", marginBottom: "12px", fontWeight: 600 }}>{success}</div>}

        {reviewers.length === 0 ? (
          <div style={{ padding: "14px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "var(--radius-sm)", marginBottom: "16px" }}>
            <p style={{ fontSize: "13px", color: "#d97706" }}>
              No active reviewers yet — invite reviewers from the <strong>Reviewers</strong> page first.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "22px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px" }}>Assign to reviewer *</label>
              <Select
                value={reviewerId}
                onChange={setReviewerId}
                options={[
                  { label: "Select a reviewer…", value: "" },
                  ...reviewers.map((r) => ({
                    label: `${r.displayName ?? r.email}${r.firstName ? ` (${r.firstName} ${r.lastName ?? ""})`.trim() : ""}`,
                    value: r.id,
                  })),
                ]}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px" }}>
                Review deadline <span style={{ fontWeight: 400 }}>(recommended)</span>
              </label>
              <input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", fontSize: "13px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }}
              />
              <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>Set a deadline so you can track whether the reviewer is on schedule</p>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <Btn label="Cancel" onClick={onClose} variant="ghost" />
          {reviewers.length > 0 && !success && (
            <Btn
              label={saving ? "Assigning…" : `Assign ${unassignedCount} questions →`}
              onClick={assign}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ── Interactive test preview modal ────────────────────────────────────────────

function TestPreviewModal({ type, questions, onClose }: { type: string; questions: any[]; onClose: () => void }) {
  const cfg = TYPE_CFG[type];
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers]  = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);

  const q = questions[current];
  const options: any[] = Array.isArray(q?.options) ? q.options : [];
  const total = questions.length;
  const answered = Object.keys(answers).length;
  const progress = Math.round((current / Math.max(total - 1, 1)) * 100);

  const selectOption = (value: string) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  };

  const next = () => {
    if (current < total - 1) setCurrent((c) => c + 1);
    else setFinished(true);
  };

  const prev = () => setCurrent((c) => Math.max(0, c - 1));

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: "600px", maxWidth: "94vw", maxHeight: "90vh",
        background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)",
        borderRadius: "var(--radius-lg)", zIndex: 70, overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", background: cfg.color, color: "#fff" }}>PREVIEW</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: cfg.color }}>{cfg.label} Assessment</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{total} questions · This is a read-only preview of what learners see</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "22px", color: "var(--color-text-muted)" }}>×</button>
        </div>

        {/* Progress bar */}
        {!finished && (
          <div style={{ padding: "10px 20px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Question {current + 1} of {total}</span>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{answered} answered</span>
            </div>
            <div style={{ height: "4px", background: "var(--color-bg-secondary)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: cfg.color, borderRadius: "2px", transition: "width 0.3s" }} />
            </div>
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
          {finished ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
              <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "8px" }}>Assessment complete!</p>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "24px" }}>
                In the live version, results are calculated and saved to the learner's profile.
              </p>
              <div style={{ padding: "16px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", textAlign: "left", marginBottom: "20px" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Preview answers ({answered}/{total})</p>
                {questions.map((qq, i) => {
                  const opts: any[] = Array.isArray(qq.options) ? qq.options : [];
                  const chosen = opts.find((o: any) => o.value === answers[qq.id]);
                  return (
                    <div key={qq.id} style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                      <strong>Q{i + 1}:</strong> {chosen ? chosen.label ?? chosen.text ?? chosen.value : <em style={{ color: "var(--color-text-muted)" }}>skipped</em>}
                    </div>
                  );
                })}
              </div>
              <Btn label="Close preview" onClick={onClose} />
            </div>
          ) : q ? (
            <>
              {q.contextNote && (
                <div style={{ padding: "10px 14px", background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.12)", borderRadius: "var(--radius-sm)", marginBottom: "20px", fontSize: "13px", color: "var(--color-text-secondary)", fontStyle: "italic" }}>
                  {q.contextNote}
                </div>
              )}

              <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.6, marginBottom: "24px" }}>
                {q.questionText}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {options.map((opt: any, i: number) => {
                  const val = opt.value ?? String(i);
                  const label = opt.label ?? opt.text ?? opt.value ?? String(i);
                  const isSelected = answers[q.id] === val;
                  return (
                    <button
                      key={i}
                      onClick={() => selectOption(val)}
                      style={{
                        padding: "14px 16px", borderRadius: "var(--radius-sm)", cursor: "pointer",
                        border: `2px solid ${isSelected ? cfg.color : "var(--color-border)"}`,
                        background: isSelected ? cfg.bg : "var(--color-card-bg)",
                        color: isSelected ? cfg.color : "var(--color-text-primary)",
                        fontSize: "14px", fontWeight: isSelected ? 600 : 400,
                        textAlign: "left", transition: "all 0.12s", width: "100%",
                        display: "flex", alignItems: "center", gap: "10px",
                      }}
                    >
                      <span style={{ width: "24px", height: "24px", borderRadius: "50%", border: `2px solid ${isSelected ? cfg.color : "var(--color-border)"}`, background: isSelected ? cfg.color : "transparent", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>
                        {isSelected ? "✓" : String.fromCharCode(65 + i)}
                      </span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <Empty message="No approved questions for this type yet" />
          )}
        </div>

        {/* Nav footer */}
        {!finished && (
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--color-card-bg)" }}>
            <Btn label="← Previous" onClick={prev} variant="ghost" small />
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
              {answers[q?.id] ? "✓ answered" : "not answered yet"}
            </span>
            <Btn label={current === total - 1 ? "Finish →" : "Next →"} onClick={next} small />
          </div>
        )}
      </div>
    </>
  );
}

// ── Question detail panel ─────────────────────────────────────────────────────

function QuestionPanel({ question, onClose, onUpdated }: { question: any; onClose: () => void; onUpdated: () => void }) {
  const cfg = TYPE_CFG[question.assessmentType] ?? TYPE_CFG.INTEREST;
  const options: any[] = Array.isArray(question.options) ? question.options : [];
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    questionText: question.questionText ?? "",
    contextNote:  question.contextNote ?? "",
    riasecMapping: (question.riasecMapping ?? []).join(", "),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const save = async () => {
    setSaving(true); setError("");
    try {
      await apiClient.patch(`/assessments/questions/${question.id}`, {
        questionText:  form.questionText,
        contextNote:   form.contextNote || null,
        riasecMapping: form.riasecMapping.split(",").map((s: string) => s.trim()).filter(Boolean),
      });
      onUpdated();
      setEditMode(false);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 40 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "540px", maxWidth: "92vw", background: "var(--color-card-bg)", borderLeft: "1px solid var(--color-card-border)", zIndex: 50, overflowY: "auto", boxShadow: "-4px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", position: "sticky", top: 0, background: "var(--color-card-bg)", zIndex: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: "999px", color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}33` }}>
                {cfg.label}
              </span>
              <ReviewStatusPill status={question.status} />
            </div>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Question #{question.orderIndex}</p>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {!editMode && <Btn label="Edit" onClick={() => setEditMode(true)} variant="ghost" small />}
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "22px", color: "var(--color-text-muted)", lineHeight: 1 }}>×</button>
          </div>
        </div>

        <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
          {error && <div style={{ padding: "8px 12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#ef4444" }}>{error}</div>}

          {/* Question text */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)", marginBottom: "8px" }}>Question</p>
            {editMode ? (
              <textarea
                value={form.questionText}
                onChange={(e) => setForm({ ...form, questionText: e.target.value })}
                rows={4}
                style={{ width: "100%", padding: "10px 12px", fontSize: "14px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }}
              />
            ) : (
              <p style={{ fontSize: "15px", color: "var(--color-text-primary)", lineHeight: 1.7 }}>{question.questionText}</p>
            )}
          </div>

          {/* Context note */}
          {(question.contextNote || editMode) && (
            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)", marginBottom: "8px" }}>Context note <span style={{ fontWeight: 400, fontSize: "10px" }}>(shown to learner as scenario framing)</span></p>
              {editMode ? (
                <textarea
                  value={form.contextNote}
                  onChange={(e) => setForm({ ...form, contextNote: e.target.value })}
                  rows={2}
                  placeholder="Optional scenario context shown before the question…"
                  style={{ width: "100%", padding: "8px 12px", fontSize: "13px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />
              ) : (
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", fontStyle: "italic", padding: "8px 12px", background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.12)", borderRadius: "var(--radius-sm)" }}>{question.contextNote}</p>
              )}
            </div>
          )}

          {/* Answer options */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)", marginBottom: "10px" }}>Answer options</p>
            {options.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", fontStyle: "italic" }}>No options defined</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {options.map((opt: any, i: number) => {
                  const label = opt.label ?? opt.text ?? opt.value ?? String(i);
                  const score = opt.score;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
                      <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: cfg.bg, border: `1px solid ${cfg.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: cfg.color, flexShrink: 0 }}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span style={{ flex: 1, fontSize: "13px", color: "var(--color-text-primary)" }}>{label}</span>
                      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        {opt.value && <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "999px", background: "var(--color-card-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontFamily: "monospace" }}>{opt.value}</span>}
                        {score !== undefined && <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "999px", background: cfg.bg, color: cfg.color, fontWeight: 700 }}>+{score}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIASEC mapping */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)", marginBottom: "8px" }}>RIASEC mapping</p>
            {editMode ? (
              <div>
                <input
                  value={form.riasecMapping}
                  onChange={(e) => setForm({ ...form, riasecMapping: e.target.value })}
                  placeholder="R, I, A, S, E, C (comma separated)"
                  style={{ width: "100%", padding: "8px 12px", fontSize: "13px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }}
                />
                <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>Realistic · Investigative · Artistic · Social · Enterprising · Conventional</p>
              </div>
            ) : question.riasecMapping?.length > 0 ? (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {question.riasecMapping.map((code: string) => {
                  const rc = RIASEC_CFG[code] ?? { label: code, color: "#94a3b8" };
                  return (
                    <span key={code} style={{ fontSize: "12px", fontWeight: 700, padding: "4px 10px", borderRadius: "999px", background: `${rc.color}15`, color: rc.color, border: `1px solid ${rc.color}33` }}>
                      {code} — {rc.label}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", fontStyle: "italic" }}>No RIASEC mapping (non-interest question)</p>
            )}
          </div>

          {/* Edit actions */}
          {editMode && (
            <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
              <Btn label={saving ? "Saving…" : "Save changes"} onClick={save} />
              <Btn label="Cancel" onClick={() => { setEditMode(false); setError(""); }} variant="ghost" />
            </div>
          )}

          {/* Status + approve action */}
          {!editMode && question.status !== "VERIFIED" && (
            <div style={{ padding: "14px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "var(--radius-sm)" }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "4px" }}>Ready to approve this question?</p>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "10px" }}>Once approved, it becomes available in the live assessment. Verified questions have been confirmed by a professional reviewer.</p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {question.status !== "APPROVED" && question.status !== "VERIFIED" && (
                  <Btn label="✓ Approve" small onClick={async () => {
                    await apiClient.patch(`/assessments/questions/${question.id}`, { status: "APPROVED" });
                    onUpdated(); onClose();
                  }} />
                )}
                {question.status === "APPROVED" && (
                  <Btn label="✓ Verify (Professional)" small onClick={async () => {
                    await apiClient.patch(`/assessments/questions/${question.id}`, { status: "VERIFIED" });
                    onUpdated(); onClose();
                  }} />
                )}
              </div>
            </div>
          )}

          {/* Meta */}
          <div style={{ paddingTop: "4px", borderTop: "1px solid var(--color-border)" }}>
            <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
              Created {timeAgo(question.createdAt)} · Order index: {question.orderIndex}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AdminAssessmentBankPage() {
  const [questions, setQuestions]   = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]       = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [status, setStatus]         = useState("");
  const [page, setPage]             = useState(1);
  const [selected, setSelected]       = useState<any | null>(null);
  const [previewType, setPreviewType]   = useState<string | null>(null);
  const [bulkAssignType, setBulkAssignType] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params: any = { page, limit: 50 };
    if (typeFilter) params.type   = typeFilter;
    if (status)     params.status = status;
    apiClient.get("/assessments/questions", { params })
      .then((r) => { setQuestions(r.data.data.questions ?? []); setPagination(r.data.data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, typeFilter, status]);

  useEffect(() => { load(); }, [load]);

  const countByType = (t: string) => questions.filter((q) => q.assessmentType === t).length;
  const countByStatus = (s: string) => questions.filter((q) => q.status === s).length;

  const previewQuestions = previewType
    ? questions.filter((q) => q.assessmentType === previewType && ["APPROVED", "VERIFIED", "AI_GENERATED"].includes(q.status))
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Assessment Bank"
        subtitle={`${pagination.total} question${pagination.total !== 1 ? "s" : ""} in the bank — all must be reviewed by a professional before going live`}
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: "12px" }}>
        {Object.entries(TYPE_CFG).map(([t, cfg]) => (
          <StatCard key={t} label={cfg.label} value={countByType(t)} accent={cfg.color} />
        ))}
      </div>

      {/* Review progress bar */}
      {questions.length > 0 && (
        <div style={{ padding: "12px 16px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>Review progress:</span>
          {[
            { label: "Needs review", status: "AI_GENERATED", color: "#f59e0b" },
            { label: "In review",    status: "IN_REVIEW",    color: "#3b82f6" },
            { label: "Approved",     status: "APPROVED",     color: "#7c3aed" },
            { label: "Verified",     status: "VERIFIED",     color: "#16a34a" },
          ].map(({ label, status: s, color }) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{label}:</span>
              <span style={{ fontSize: "12px", fontWeight: 700, color }}>{countByStatus(s)}</span>
            </div>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {Object.keys(TYPE_CFG).map((t) => {
              const unassigned = questions.filter((q) => q.assessmentType === t && q.status === "AI_GENERATED").length;
              return (
                <button
                  key={t}
                  onClick={() => setBulkAssignType(t)}
                  title={`Assign all ${unassigned} unreviewed ${TYPE_CFG[t].label} questions to a reviewer`}
                  style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "999px", border: `1px solid ${TYPE_CFG[t].color}44`, background: unassigned > 0 ? TYPE_CFG[t].bg : "var(--color-bg-secondary)", color: unassigned > 0 ? TYPE_CFG[t].color : "var(--color-text-muted)", cursor: unassigned > 0 ? "pointer" : "default", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}
                >
                  Assign {TYPE_CFG[t].label}
                  {unassigned > 0 && (
                    <span style={{ background: TYPE_CFG[t].color, color: "#fff", borderRadius: "999px", padding: "0 5px", fontSize: "9px", fontWeight: 800 }}>{unassigned}</span>
                  )}
                </button>
              );
            })}
            <div style={{ width: "1px", background: "var(--color-border)", margin: "0 2px" }} />
            {Object.keys(TYPE_CFG).map((t) => (
              <button key={t} onClick={() => setPreviewType(t)} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "999px", border: "1px solid var(--color-border)", background: "var(--color-card-bg)", color: "var(--color-text-muted)", cursor: "pointer" }}>
                Preview {TYPE_CFG[t].label} →
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Type filter tags */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <button
          onClick={() => { setTypeFilter(""); setPage(1); }}
          style={{ padding: "6px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: typeFilter === "" ? 700 : 500, border: typeFilter === "" ? "2px solid var(--color-accent)" : "1px solid var(--color-border)", background: typeFilter === "" ? "rgba(99,102,241,0.08)" : "var(--color-card-bg)", color: typeFilter === "" ? "var(--color-accent)" : "var(--color-text-muted)", cursor: "pointer" }}>
          All ({pagination.total})
        </button>
        {Object.keys(TYPE_CFG).map((t) => (
          <TypeTag key={t} type={t} active={typeFilter === t} count={countByType(t)} onClick={() => { setTypeFilter(t); setPage(1); }} />
        ))}
        <div style={{ marginLeft: "auto" }}>
          <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[
            { label: "All statuses",  value: "" },
            { label: "Needs review",  value: "AI_GENERATED" },
            { label: "In review",     value: "IN_REVIEW" },
            { label: "Approved",      value: "APPROVED" },
            { label: "Verified",      value: "VERIFIED" },
          ]} />
        </div>
      </div>

      {/* Table */}
      <Card noPad>
        {loading ? <Spinner /> : questions.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginBottom: "8px" }}>
              {pagination.total === 0 ? "No questions yet — generate some from AI Pipeline → Assessment Question" : "No questions match your filters"}
            </p>
            {pagination.total === 0 && (
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Generate questions for each type: Interest, Aptitude, Personality, and Values</p>
            )}
          </div>
        ) : (
          <Table headers={["#", "Question", "Type", "RIASEC", "Options", "Status", ""]}>
            {questions.map((q) => {
              const cfg = TYPE_CFG[q.assessmentType] ?? TYPE_CFG.INTEREST;
              const opts: any[] = Array.isArray(q.options) ? q.options : [];
              return (
                <TableRow
                  key={q.id}
                  cols={[
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 600 }}>{q.orderIndex}</span>,

                    <div style={{ maxWidth: "340px" }}>
                      <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {q.questionText}
                      </p>
                      {q.contextNote && <p style={{ fontSize: "11px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle: "italic" }}>📌 {q.contextNote}</p>}
                    </div>,

                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", color: cfg.color, background: cfg.bg }}>
                      {cfg.label}
                    </span>,

                    q.riasecMapping?.length > 0
                      ? <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                          {q.riasecMapping.map((c: string) => (
                            <span key={c} style={{ fontSize: "10px", fontWeight: 800, width: "18px", height: "18px", borderRadius: "50%", background: `${RIASEC_CFG[c]?.color ?? "#94a3b8"}20`, color: RIASEC_CFG[c]?.color ?? "#94a3b8", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{c}</span>
                          ))}
                        </div>
                      : <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>—</span>,

                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{opts.length} options</span>,

                    <ReviewStatusPill status={q.status} />,

                    <Btn label="View →" onClick={() => setSelected(q)} variant="ghost" small />,
                  ]}
                />
              );
            })}
          </Table>
        )}
        <Pagination page={page} pages={pagination.pages} onPage={setPage} />
      </Card>

      {/* Type descriptions */}
      {questions.length === 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: "10px" }}>
          {Object.entries(TYPE_CFG).map(([t, cfg]) => (
            <div key={t} style={{ padding: "14px 16px", background: cfg.bg, border: `1px solid ${cfg.color}22`, borderRadius: "var(--radius-sm)" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: cfg.color, marginBottom: "4px" }}>{cfg.label}</p>
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{cfg.description}</p>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <QuestionPanel question={selected} onClose={() => setSelected(null)} onUpdated={() => { load(); setSelected(null); }} />
      )}

      {bulkAssignType && (
        <BulkAssignModal
          assessmentType={bulkAssignType}
          unassignedCount={questions.filter((q) => q.assessmentType === bulkAssignType && q.status === "AI_GENERATED").length}
          onClose={() => setBulkAssignType(null)}
          onAssigned={() => { setBulkAssignType(null); load(); }}
        />
      )}

      {previewType && (
        <TestPreviewModal
          type={previewType}
          questions={previewQuestions}
          onClose={() => setPreviewType(null)}
        />
      )}
    </div>
  );
}
