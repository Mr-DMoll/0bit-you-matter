"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/client";
import {
  PageHeader, Card, StatCard, Table, TableRow, Badge,
  Spinner, Empty, Pagination, timeAgo,
} from "@/features/admin/components/AdminShell";

const CONTENT_TYPES = [
  { value: "",                          label: "All types" },
  { value: "CAREER",                    label: "Career" },
  { value: "BURSARY",                   label: "Bursary" },
  { value: "TVET_COLLEGE",              label: "TVET College" },
  { value: "PATHWAY",                   label: "Pathway" },
  { value: "ASSESSMENT_QUESTION",       label: "Assessment Question" },
  { value: "UNIVERSITY_PROGRAMME",      label: "University Programme" },
  { value: "UNIVERSITY_PROGRAMMES_BULK",label: "University Programmes (Bulk)" },
  { value: "TVET_PROGRAMMES_BULK",      label: "TVET Programmes (Bulk)" },
];

const STATE_FILTERS = [
  { label: "All",       value: "",            color: "var(--color-text-muted)", activeBg: "var(--color-bg-subtle)",    activeBorder: "var(--color-border)"       },
  { label: "Queued",    value: "PENDING",     color: "#92400e",                 activeBg: "rgba(245,158,11,0.12)",     activeBorder: "rgba(245,158,11,0.4)"      },
  { label: "In Review", value: "IN_PROGRESS", color: "#1e40af",                 activeBg: "rgba(59,130,246,0.12)",     activeBorder: "rgba(59,130,246,0.4)"      },
  { label: "Draft",     value: "DRAFT",       color: "#6d28d9",                 activeBg: "rgba(139,92,246,0.12)",     activeBorder: "rgba(139,92,246,0.4)"      },
  { label: "Live",      value: "APPROVED",    color: "#166534",                 activeBg: "rgba(34,197,94,0.12)",      activeBorder: "rgba(34,197,94,0.4)"       },
  { label: "Archived",  value: "REJECTED",    color: "#991b1b",                 activeBg: "rgba(239,68,68,0.12)",      activeBorder: "rgba(239,68,68,0.4)"       },
];

const PILL_STYLE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING:     { label: "Queued",    color: "#92400e", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)"  },
  IN_PROGRESS: { label: "In Review", color: "#1e40af", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.3)"  },
  DRAFT:       { label: "Draft",     color: "#6d28d9", bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.3)"  },
  APPROVED:    { label: "Live",      color: "#166534", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.3)"   },
  REJECTED:    { label: "Archived",  color: "#991b1b", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)"   },
};

function StatePill({ status }: { status: string }) {
  const s = PILL_STYLE[status] ?? { label: status, color: "var(--color-text-muted)", bg: "var(--color-bg-secondary)", border: "var(--color-border)" };
  return (
    <span style={{
      display: "inline-block", fontSize: 11, fontWeight: 700,
      padding: "3px 10px", borderRadius: 999,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      letterSpacing: "0.05em", textTransform: "uppercase",
    }}>
      {s.label}
    </span>
  );
}

const ASSESSMENT_SUBTYPES = [
  { value: "",            label: "All types" },
  { value: "INTEREST",    label: "Interest" },
  { value: "APTITUDE",    label: "Aptitude" },
  { value: "PERSONALITY", label: "Personality" },
  { value: "VALUES",      label: "Values" },
];

export function ReviewerQueuePage() {
  const router = useRouter();
  const [reviews,        setReviews]        = useState<any[]>([]);
  const [pagination,     setPagination]     = useState({ total: 0, page: 1, pages: 1 });
  const [loading,        setLoading]        = useState(true);
  const [status,         setStatus]         = useState("");
  const [contentType,    setContentType]    = useState("");
  const [assessmentType, setAssessmentType] = useState("");
  const [page,           setPage]           = useState(1);

  // When launching into a review, fetch ALL matching items (ignoring status so the
  // list stays stable as items get approved/rejected), store in sessionStorage once,
  // then navigate. ReviewScreenPage reads from sessionStorage — no re-fetch.
  const handleReview = async (id: string) => {
    try {
      const p: any = { limit: 500 };
      if (contentType)    p.type           = contentType;
      if (assessmentType) p.assessmentType = assessmentType;
      // No status filter here — we want the full ordered list so indices never shift
      const res = await apiClient.get("/content/reviews", { params: p });
      const ids: string[] = (res.data.data.reviews ?? []).map((rev: any) => rev.id as string);

      let label = "Review Queue";
      if (assessmentType) {
        label = `${assessmentType.charAt(0)}${assessmentType.slice(1).toLowerCase()} Assessment`;
      } else if (contentType) {
        label = contentType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      }

      sessionStorage.setItem("reviewQueue", JSON.stringify({ ids, label }));
    } catch {
      // If fetch fails, just navigate without queue context — no playlist, no crash
    }
    router.push(`/reviewer/review/${id}?fromQueue=1`);
  };

  const load = useCallback(() => {
    setLoading(true);
    const params: any = { page };
    if (status)         params.status         = status;
    if (contentType)    params.type           = contentType;
    if (assessmentType) params.assessmentType = assessmentType;
    apiClient.get("/content/reviews", { params })
      .then((r) => {
        setReviews(r.data.data.reviews ?? []);
        setPagination(r.data.data.pagination ?? { total: 0, page: 1, pages: 1 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, status, contentType, assessmentType]);

  useEffect(() => { load(); }, [load]);

  const pending  = reviews.filter((r) => r.status === "PENDING").length;
  const inProg   = reviews.filter((r) => r.status === "IN_PROGRESS").length;
  const drafts   = reviews.filter((r) => r.status === "DRAFT").length;
  const verified = reviews.filter((r) => r.status === "APPROVED").length;

  const showAssessmentSubFilter = contentType === "ASSESSMENT_QUESTION";
  const hasFilters = status !== "" || contentType !== "" || assessmentType !== "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader title="Review Queue" subtitle="AI-generated content assigned to you — review each item and verify or discard" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
        <StatCard label="Assigned"  value={pagination.total} />
        <StatCard label="Queued"    value={pending}  accent="#f59e0b" />
        <StatCard label="In Review" value={inProg}   accent="#3b82f6" />
        <StatCard label="Drafts"    value={drafts}   accent="#8b5cf6" />
        <StatCard label="Verified"  value={verified} accent="#22c55e" />
      </div>

      {/* Filters row: type dropdown first, then state pills */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>

        {/* Content type dropdown */}
        <div style={{ position: "relative" }}>
          <select
            value={contentType}
            onChange={(e) => { setContentType(e.target.value); setAssessmentType(""); setPage(1); }}
            style={{
              appearance: "none",
              padding: "7px 36px 7px 14px",
              borderRadius: 999,
              fontSize: 13, fontWeight: 600,
              border: `1.5px solid ${contentType ? "rgba(99,102,241,0.5)" : "var(--color-border)"}`,
              background: contentType ? "rgba(99,102,241,0.08)" : "var(--color-bg-secondary)",
              color: contentType ? "#4338ca" : "var(--color-text-muted)",
              cursor: "pointer",
              outline: "none",
              minWidth: 140,
            }}
          >
            {CONTENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {/* Chevron icon */}
          <span style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            pointerEvents: "none", fontSize: 11,
            color: contentType ? "#4338ca" : "var(--color-text-muted)",
          }}>▾</span>
        </div>

        {/* Assessment sub-type filter — only when ASSESSMENT_QUESTION is selected */}
        {showAssessmentSubFilter && (
          <>
            <div style={{ width: 1, height: 24, background: "var(--color-border)", flexShrink: 0 }} />
            <div style={{ position: "relative" }}>
              <select
                value={assessmentType}
                onChange={(e) => { setAssessmentType(e.target.value); setPage(1); }}
                style={{
                  appearance: "none",
                  padding: "7px 36px 7px 14px",
                  borderRadius: 999,
                  fontSize: 13, fontWeight: 600,
                  border: `1.5px solid ${assessmentType ? "rgba(234,88,12,0.5)" : "var(--color-border)"}`,
                  background: assessmentType ? "rgba(234,88,12,0.08)" : "var(--color-bg-secondary)",
                  color: assessmentType ? "#c2410c" : "var(--color-text-muted)",
                  cursor: "pointer",
                  outline: "none",
                  minWidth: 130,
                }}
              >
                {ASSESSMENT_SUBTYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <span style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                pointerEvents: "none", fontSize: 11,
                color: assessmentType ? "#c2410c" : "var(--color-text-muted)",
              }}>▾</span>
            </div>
          </>
        )}

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: "var(--color-border)", flexShrink: 0 }} />

        {/* State pills */}
        {STATE_FILTERS.map((f) => {
          const active = status === f.value;
          return (
            <button
              key={f.value}
              onClick={() => { setStatus(f.value); setPage(1); }}
              style={{
                padding: "6px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600,
                border: `1.5px solid ${active ? f.activeBorder : "var(--color-border)"}`,
                background: active ? f.activeBg : "transparent",
                color: active ? f.color : "var(--color-text-muted)",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          );
        })}

        {/* Clear all — only when a filter is active */}
        {hasFilters && (
          <button
            onClick={() => { setStatus(""); setContentType(""); setAssessmentType(""); setPage(1); }}
            style={{
              marginLeft: "auto", padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600,
              border: "1.5px solid var(--color-border)", background: "transparent",
              color: "var(--color-text-muted)", cursor: "pointer",
            }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      <Card noPad>
        {loading ? <Spinner /> : reviews.length === 0 ? (
          <Empty message={hasFilters ? "No results for this filter combination" : "Your review queue is empty"} />
        ) : (
          <Table headers={["Content", "Type", "Assigned", "State", ""]}>
            {reviews.map((r) => (
              <TableRow
                key={r.id}
                cols={[
                  <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
                    {r.career?.title ?? r.question?.questionText?.slice(0, 60) ?? r.tvetCollege?.name ?? r.bursary?.name ?? r.pathway?.title ?? "—"}
                  </span>,
                  <Badge label={r.contentType?.replace(/_/g, " ")} color="#6366f1" />,
                  timeAgo(r.createdAt),
                  <StatePill status={r.status} />,
                  r.status === "PENDING" || r.status === "IN_PROGRESS"
                    ? <button onClick={() => handleReview(r.id)} style={{ padding: "4px 12px", background: "#6366f1", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>Review →</button>
                    : r.status === "DRAFT"
                      ? <button onClick={() => handleReview(r.id)} style={{ padding: "4px 12px", background: "rgba(139,92,246,0.12)", color: "#6d28d9", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Continue →</button>
                      : <button onClick={() => handleReview(r.id)} style={{ padding: "4px 12px", background: "transparent", color: "var(--color-text-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>Edit →</button>,
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
