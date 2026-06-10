"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, StatCard, Table, TableRow, statusBadge,
  Spinner, Empty, SearchInput, Select, Pagination, Btn, Badge,
} from "../components/AdminShell";

const PATHWAY_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  UNIVERSITY:  { label: "University",  color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
  TVET:        { label: "TVET",        color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  LEARNERSHIP: { label: "Learnership", color: "#22c55e", bg: "rgba(34,197,94,0.1)"  },
  DIRECT:      { label: "Direct/RPL",  color: "#64748b", bg: "rgba(100,116,139,0.1)"},
};

function PathwayTypeBadge({ type }: { type: string }) {
  const cfg = PATHWAY_TYPE_CONFIG[type] ?? { label: type, color: "#94a3b8", bg: "rgba(148,163,184,0.1)" };
  return (
    <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function ZAR(n?: number | null) {
  if (!n) return "—";
  return `R${(n / 1000).toFixed(0)}k`;
}

// ── Pathway detail panel ──────────────────────────────────────────────────────

function PathwayPanel({ pathway, onClose, onUpdated }: { pathway: any; onClose: () => void; onUpdated: () => void }) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    title:               pathway.title ?? "",
    durationLabel:       pathway.durationLabel ?? "",
    durationMonths:      String(pathway.durationMonths ?? ""),
    estimatedCostMin:    String(pathway.estimatedCostMin ?? ""),
    estimatedCostMax:    String(pathway.estimatedCostMax ?? ""),
    costNote:            pathway.costNote ?? "",
    earnWhileLearn:      pathway.earnWhileLearn ?? false,
    entryRequirements:   pathway.entryRequirements ?? "",
    apsMin:              String(pathway.apsMin ?? ""),
    gradeMin:            String(pathway.gradeMin ?? ""),
    fundingOptions:      (pathway.fundingOptions ?? []).join(", "),
    setaName:            pathway.setaName ?? "",
    qualificationEarned: pathway.qualificationEarned ?? "",
    nqfLevelEarned:      String(pathway.nqfLevelEarned ?? ""),
    employmentNote:      pathway.employmentNote ?? "",
    pros:                (pathway.pros ?? []).join("\n"),
    cons:                (pathway.cons ?? []).join("\n"),
    sourceUrl:           pathway.sourceUrl ?? "",
    verifiedNote:        pathway.verifiedNote ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const save = async () => {
    setSaving(true); setError("");
    try {
      await apiClient.patch(`/pathways/${pathway.id}`, {
        ...form,
        durationMonths:   form.durationMonths   ? parseInt(form.durationMonths)   : undefined,
        estimatedCostMin: form.estimatedCostMin ? parseInt(form.estimatedCostMin) : undefined,
        estimatedCostMax: form.estimatedCostMax ? parseInt(form.estimatedCostMax) : undefined,
        apsMin:           form.apsMin           ? parseInt(form.apsMin)           : undefined,
        gradeMin:         form.gradeMin         ? parseInt(form.gradeMin)         : undefined,
        nqfLevelEarned:   form.nqfLevelEarned   ? parseInt(form.nqfLevelEarned)   : undefined,
        fundingOptions:   form.fundingOptions.split(",").map((s: string) => s.trim()).filter(Boolean),
        pros:             form.pros.split("\n").map((s: string) => s.trim()).filter(Boolean),
        cons:             form.cons.split("\n").map((s: string) => s.trim()).filter(Boolean),
      });
      setEditMode(false);
      onUpdated();
    } catch (e: any) { setError(e?.response?.data?.message ?? "Save failed"); }
    setSaving(false);
  };

  const archive = async () => {
    if (!confirm("Archive this pathway?")) return;
    await apiClient.patch(`/pathways/${pathway.id}`, { status: "ARCHIVED" });
    onUpdated();
  };

  const steps: any[] = Array.isArray(pathway.steps) ? pathway.steps : [];

  function InlineInput({ value, onChange, placeholder, type = "text" }: any) {
    return (
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "7px 10px", fontSize: "13px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" as const }} />
    );
  }
  function InlineTA({ value, onChange, placeholder, rows = 3 }: any) {
    return (
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ width: "100%", padding: "7px 10px", fontSize: "13px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" as const, resize: "vertical" as const, fontFamily: "inherit" }} />
    );
  }
  function FL({ label, children }: any) {
    return (
      <div>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "5px" }}>{label}</label>
        {children}
      </div>
    );
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 40 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "560px", maxWidth: "92vw", background: "var(--color-card-bg)", borderLeft: "1px solid var(--color-card-border)", zIndex: 50, overflowY: "auto", display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", position: "sticky", top: 0, background: "var(--color-card-bg)", zIndex: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
              <PathwayTypeBadge type={pathway.type} />
              {statusBadge(pathway.status)}
            </div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>{pathway.title}</h2>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{pathway.career?.title} · {pathway.career?.cluster?.name}</p>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={() => setEditMode(!editMode)} style={{ padding: "4px 10px", fontSize: "12px", background: editMode ? "var(--color-accent)" : "none", color: editMode ? "#fff" : "var(--color-text-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>{editMode ? "Cancel" : "Edit"}</button>
            <button onClick={archive} style={{ padding: "4px 10px", fontSize: "12px", background: "none", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>Archive</button>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--color-text-muted)" }}>×</button>
          </div>
        </div>

        <div style={{ padding: "20px", flex: 1 }}>
          {error && <div style={{ padding: "8px 12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#ef4444", marginBottom: "12px" }}>{error}</div>}

          {editMode ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <FL label="Title"><InlineInput value={form.title} onChange={(v: string) => setForm({ ...form, title: v })} /></FL>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <FL label="Duration label"><InlineInput value={form.durationLabel} onChange={(v: string) => setForm({ ...form, durationLabel: v })} placeholder="3–4 years" /></FL>
                <FL label="Duration (months)"><InlineInput value={form.durationMonths} onChange={(v: string) => setForm({ ...form, durationMonths: v })} type="number" placeholder="42" /></FL>
                <FL label="Cost min (ZAR/yr)"><InlineInput value={form.estimatedCostMin} onChange={(v: string) => setForm({ ...form, estimatedCostMin: v })} type="number" /></FL>
                <FL label="Cost max (ZAR/yr)"><InlineInput value={form.estimatedCostMax} onChange={(v: string) => setForm({ ...form, estimatedCostMax: v })} type="number" /></FL>
                <FL label="APS min"><InlineInput value={form.apsMin} onChange={(v: string) => setForm({ ...form, apsMin: v })} type="number" /></FL>
                <FL label="Grade min"><InlineInput value={form.gradeMin} onChange={(v: string) => setForm({ ...form, gradeMin: v })} type="number" /></FL>
                <FL label="NQF level earned"><InlineInput value={form.nqfLevelEarned} onChange={(v: string) => setForm({ ...form, nqfLevelEarned: v })} type="number" /></FL>
                <FL label="SETA name"><InlineInput value={form.setaName} onChange={(v: string) => setForm({ ...form, setaName: v })} placeholder="MERSETA" /></FL>
              </div>
              <FL label="Cost note"><InlineInput value={form.costNote} onChange={(v: string) => setForm({ ...form, costNote: v })} placeholder="NSFAS covers fees for qualifying students" /></FL>
              <FL label="Entry requirements"><InlineTA value={form.entryRequirements} onChange={(v: string) => setForm({ ...form, entryRequirements: v })} rows={2} /></FL>
              <FL label="Qualification earned"><InlineInput value={form.qualificationEarned} onChange={(v: string) => setForm({ ...form, qualificationEarned: v })} /></FL>
              <FL label="Employment note"><InlineTA value={form.employmentNote} onChange={(v: string) => setForm({ ...form, employmentNote: v })} rows={2} /></FL>
              <FL label="Funding options (comma-separated)"><InlineInput value={form.fundingOptions} onChange={(v: string) => setForm({ ...form, fundingOptions: v })} placeholder="NSFAS, MERSETA Bursary" /></FL>
              <FL label="Pros (one per line)"><InlineTA value={form.pros} onChange={(v: string) => setForm({ ...form, pros: v })} rows={4} /></FL>
              <FL label="Cons (one per line)"><InlineTA value={form.cons} onChange={(v: string) => setForm({ ...form, cons: v })} rows={3} /></FL>
              <FL label="Source URL"><InlineInput value={form.sourceUrl} onChange={(v: string) => setForm({ ...form, sourceUrl: v })} placeholder="https://…" /></FL>
              <FL label="Verified note"><InlineInput value={form.verifiedNote} onChange={(v: string) => setForm({ ...form, verifiedNote: v })} /></FL>
              <div style={{ display: "flex", gap: "8px" }}>
                <Btn label={saving ? "Saving…" : "Save"} onClick={save} />
                <Btn label="Cancel" onClick={() => setEditMode(false)} variant="ghost" />
              </div>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "20px" }}>
                <div style={{ padding: "10px 12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Duration</p>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{pathway.durationLabel ?? "—"}</p>
                </div>
                <div style={{ padding: "10px 12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Cost/yr</p>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{ZAR(pathway.estimatedCostMin)}–{ZAR(pathway.estimatedCostMax)}</p>
                </div>
                <div style={{ padding: "10px 12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Earn while learn</p>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: pathway.earnWhileLearn ? "#22c55e" : "var(--color-text-primary)" }}>{pathway.earnWhileLearn ? "Yes ✓" : "No"}</p>
                </div>
              </div>

              {/* Steps */}
              {steps.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "10px" }}>Journey steps</p>
                  {steps.map((s: any, i: number) => (
                    <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "10px" }}>
                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--color-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{s.step ?? i + 1}</div>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{s.title}</p>
                        {s.description && <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>{s.description}</p>}
                        {s.duration && <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>{s.duration}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Funding */}
              {pathway.fundingOptions?.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>Funding options</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {pathway.fundingOptions.map((f: string) => (
                      <span key={f} style={{ padding: "3px 8px", background: "rgba(34,197,94,0.1)", color: "#22c55e", borderRadius: "999px", fontSize: "12px", fontWeight: 500 }}>{f}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pros / Cons */}
              {(pathway.pros?.length > 0 || pathway.cons?.length > 0) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  {pathway.pros?.length > 0 && (
                    <div>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "#22c55e", marginBottom: "6px" }}>Pros</p>
                      {pathway.pros.map((p: string, i: number) => <p key={i} style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "3px" }}>✓ {p}</p>)}
                    </div>
                  )}
                  {pathway.cons?.length > 0 && (
                    <div>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "#f59e0b", marginBottom: "6px" }}>Trade-offs</p>
                      {pathway.cons.map((c: string, i: number) => <p key={i} style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "3px" }}>· {c}</p>)}
                    </div>
                  )}
                </div>
              )}

              {pathway.sourceUrl && (
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                  Source: <a href={pathway.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "var(--color-accent)" }}>{pathway.sourceUrl}</a>
                </p>
              )}
              {pathway.verifiedNote && <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>✓ {pathway.verifiedNote}</p>}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AdminPathwaysLibraryPage() {
  const [pathways, setPathways]     = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatus]   = useState("");
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState<any | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params: any = { page };
    if (typeFilter)   params.type   = typeFilter;
    if (statusFilter) params.status = statusFilter;
    apiClient.get("/pathways", { params })
      .then((r) => { setPathways(r.data.data.pathways ?? []); setPagination(r.data.data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, typeFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? pathways.filter((p) => p.title?.toLowerCase().includes(search.toLowerCase()) || p.career?.title?.toLowerCase().includes(search.toLowerCase()))
    : pathways;

  const countByType = (t: string) => pathways.filter((p) => p.type === t).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Pathways Library"
        subtitle={`${pagination.total} pathways — the routes learners take to their careers`}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))", gap: "12px" }}>
        <StatCard label="Total"        value={pagination.total} />
        <StatCard label="University"   value={countByType("UNIVERSITY")}  accent="#6366f1" />
        <StatCard label="TVET"         value={countByType("TVET")}         accent="#f59e0b" />
        <StatCard label="Learnership"  value={countByType("LEARNERSHIP")}  accent="#22c55e" />
        <StatCard label="Direct"       value={countByType("DIRECT")}       accent="#64748b" />
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by career or pathway title…" />
        <Select value={typeFilter} onChange={(v) => { setTypeFilter(v); setPage(1); }} options={[
          { label: "All types",     value: "" },
          { label: "University",    value: "UNIVERSITY" },
          { label: "TVET",          value: "TVET" },
          { label: "Learnership",   value: "LEARNERSHIP" },
          { label: "Direct / RPL",  value: "DIRECT" },
        ]} />
        <Select value={statusFilter} onChange={(v) => { setStatus(v); setPage(1); }} options={[
          { label: "All statuses",  value: "" },
          { label: "AI Generated",  value: "AI_GENERATED" },
          { label: "Approved",      value: "APPROVED" },
          { label: "Verified",      value: "VERIFIED" },
        ]} />
      </div>

      <Card noPad>
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <Empty message="No pathways yet — use AI Pipeline to generate pathways for careers" />
        ) : (
          <Table headers={["Career", "Cluster", "Route", "Duration", "Cost/yr", "Funding", "Status", ""]}>
            {filtered.map((p) => (
              <TableRow
                key={p.id}
                cols={[
                  <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{p.career?.title ?? "—"}</span>,
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{p.career?.cluster?.name ?? "—"}</span>,
                  <PathwayTypeBadge type={p.type} />,
                  p.durationLabel ?? "—",
                  p.estimatedCostMin ? `${ZAR(p.estimatedCostMin)}–${ZAR(p.estimatedCostMax)}` : "—",
                  <span style={{ fontSize: "11px" }}>{p.fundingOptions?.slice(0, 2).join(", ") || "—"}</span>,
                  statusBadge(p.status),
                  <Btn label="View →" onClick={() => setSelected(p)} variant="ghost" small />,
                ]}
              />
            ))}
          </Table>
        )}
        <Pagination page={page} pages={pagination.pages} onPage={setPage} />
      </Card>

      {selected && (
        <PathwayPanel
          pathway={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => { load(); setSelected(null); }}
        />
      )}
    </div>
  );
}
