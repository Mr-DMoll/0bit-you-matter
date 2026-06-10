"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, StatCard, Table, TableRow, statusBadge,
  Spinner, Empty, SearchInput, Select, Pagination, Btn,
} from "../components/AdminShell";

const PROVINCES = [
  "Gauteng","Western Cape","KwaZulu-Natal","Eastern Cape",
  "Free State","Limpopo","Mpumalanga","Northern Cape","North West",
];

// Known SA private FET/TVET providers — for reference when adding manually
const KNOWN_PRIVATE = [
  "Boston City Campus & Business College",
  "Damelin",
  "Rosebank College",
  "STADIO",
  "IIE MSA (Management College of Southern Africa)",
  "Oxbridge Academy",
  "Richfield Graduate Institute",
  "College SA",
  "Regent Business School",
  "CTU Training Solutions",
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "5px" }}>{label}</label>
      {children}
    </div>
  );
}
function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "7px 10px", fontSize: "13px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }} />
  );
}

// ── College detail panel ──────────────────────────────────────────────────────

function CollegePanel({ college, onClose, onUpdated }: { college: any; onClose: () => void; onUpdated: () => void }) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm]         = useState({
    name: college.name, abbreviation: college.abbreviation ?? "",
    province: college.province, website: college.website ?? "",
    sourceUrl: college.sourceUrl ?? "", verifiedNote: college.verifiedNote ?? "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await apiClient.patch(`/tvet/${college.id}`, form);
      setEditMode(false);
      onUpdated();
    } catch {}
    setSaving(false);
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 40 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "480px", maxWidth: "92vw", background: "var(--color-card-bg)", borderLeft: "1px solid var(--color-card-border)", zIndex: 50, overflowY: "auto", display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", position: "sticky", top: 0, background: "var(--color-card-bg)", zIndex: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "2px" }}>
              {statusBadge(college.status)}
              <span style={{ fontSize: "11px", padding: "1px 6px", borderRadius: "4px", background: "rgba(139,92,246,0.12)", color: "#8b5cf6", fontWeight: 600 }}>PRIVATE</span>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{college.province}</span>
            </div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--color-text-primary)" }}>{college.name}</h2>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <Btn label={editMode ? "Cancel" : "Edit"} onClick={() => setEditMode(!editMode)} variant="ghost" small />
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--color-text-muted)" }}>×</button>
          </div>
        </div>

        <div style={{ padding: "20px", flex: 1 }}>
          {editMode ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field label="Name"><Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} /></Field>
                <Field label="Abbreviation"><Input value={form.abbreviation} onChange={(v) => setForm({ ...form, abbreviation: v })} placeholder="e.g. Boston" /></Field>
                <Field label="Province">
                  <Select value={form.province} onChange={(v) => setForm({ ...form, province: v })} options={PROVINCES.map((p) => ({ label: p, value: p }))} />
                </Field>
                <Field label="Website"><Input value={form.website} onChange={(v) => setForm({ ...form, website: v })} placeholder="https://…" /></Field>
              </div>
              <Field label="Source URL">
                <Input value={form.sourceUrl} onChange={(v) => setForm({ ...form, sourceUrl: v })} placeholder="https://…" />
              </Field>
              <Field label="Verified note">
                <Input value={form.verifiedNote} onChange={(v) => setForm({ ...form, verifiedNote: v })} placeholder="Checked against QCTO registration 2025" />
              </Field>
              <Btn label={saving ? "Saving…" : "Save"} onClick={save} />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
              {[
                { label: "Province", value: college.province,     link: null },
                { label: "Website",  value: college.website,      link: college.website },
                { label: "Source",   value: college.sourceUrl ? "Visit source" : null, link: college.sourceUrl },
                { label: "Verified", value: college.verifiedNote, link: null },
              ].filter(i => i.value).map(({ label, value, link }) => (
                <div key={label} style={{ padding: "8px 12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{label}</p>
                  {link
                    ? <a href={link} target="_blank" rel="noreferrer" style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-accent)", marginTop: "2px", display: "block", wordBreak: "break-all" }}>{value}</a>
                    : <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-primary)", marginTop: "2px" }}>{value}</p>
                  }
                </div>
              ))}
            </div>
          )}

          {/* Approve / verify actions */}
          {!editMode && college.status !== "VERIFIED" && (
            <div style={{ padding: "12px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "var(--radius-sm)" }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#22c55e", marginBottom: "6px" }}>Verification</p>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "10px" }}>
                Check the website, confirm QCTO/SETA registration, then mark as verified.
              </p>
              <Btn label="Mark as Verified" onClick={async () => {
                await apiClient.patch(`/tvet/${college.id}`, { status: "VERIFIED" });
                onUpdated();
                onClose();
              }} small />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AdminPrivateCollegesPage() {
  const [colleges, setColleges]     = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [province, setProvince]     = useState("");
  const [status, setStatus]         = useState("");
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState<any | null>(null);
  const [showAdd, setShowAdd]       = useState(false);
  const [addForm, setAddForm]       = useState({ name: "", abbreviation: "", province: "Gauteng", website: "", sourceUrl: "" });
  const [addSaving, setAddSaving]   = useState(false);
  const [nameSuggestions]           = useState(KNOWN_PRIVATE);

  const load = useCallback(() => {
    setLoading(true);
    const params: any = { page, collegeType: "PRIVATE" };
    if (province) params.province = province;
    if (status)   params.status   = status;
    if (search)   params.search   = search;
    apiClient.get("/tvet", { params })
      .then((r) => { setColleges(r.data.data.colleges ?? []); setPagination(r.data.data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, province, status, search]);

  useEffect(() => { load(); }, [load]);

  const addCollege = async () => {
    if (!addForm.name) return;
    setAddSaving(true);
    try {
      await apiClient.post("/tvet", { ...addForm, collegeType: "PRIVATE" });
      setShowAdd(false);
      setAddForm({ name: "", abbreviation: "", province: "Gauteng", website: "", sourceUrl: "" });
      load();
    } catch {}
    setAddSaving(false);
  };

  const verifiedCount = colleges.filter(c => c.status === "VERIFIED").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Private Colleges"
        subtitle="QCTO-registered private FET/TVET providers — Boston, Damelin, Rosebank & others"
        action={<Btn label="+ Add college" onClick={() => setShowAdd(!showAdd)} variant="ghost" />}
      />

      {/* Info banner */}
      <div style={{ padding: "12px 16px", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
        <strong style={{ color: "#8b5cf6" }}>Private vs Public TVET</strong> — These colleges are privately owned but registered with QCTO/SETA.
        Many are NSFAS-accredited. They offer similar NATED programmes to public colleges but at higher fees.
        All entries require internal verification before learners can see them.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: "12px" }}>
        <StatCard label="Colleges"  value={pagination.total} />
        <StatCard label="Verified"  value={verifiedCount}    accent="#22c55e" />
        <StatCard label="Pending"   value={pagination.total - verifiedCount} accent="#f59e0b" />
      </div>

      {showAdd && (
        <Card title="Add private college">
          {/* Quick-add suggestions */}
          {nameSuggestions.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "6px" }}>Quick add known providers:</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {nameSuggestions.map((n) => (
                  <button key={n} onClick={() => setAddForm({ ...addForm, name: n })}
                    style={{ padding: "3px 10px", fontSize: "11px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "20px", cursor: "pointer", color: "var(--color-text-muted)" }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Field label="Name *"><Input value={addForm.name} onChange={(v) => setAddForm({ ...addForm, name: v })} placeholder="Boston City Campus…" /></Field>
            <Field label="Abbreviation"><Input value={addForm.abbreviation} onChange={(v) => setAddForm({ ...addForm, abbreviation: v })} placeholder="Boston" /></Field>
            <Field label="Province (head office)">
              <Select value={addForm.province} onChange={(v) => setAddForm({ ...addForm, province: v })} options={PROVINCES.map((p) => ({ label: p, value: p }))} />
            </Field>
            <Field label="Website"><Input value={addForm.website} onChange={(v) => setAddForm({ ...addForm, website: v })} placeholder="https://…" /></Field>
            <Field label="Source URL">
              <Input value={addForm.sourceUrl} onChange={(v) => setAddForm({ ...addForm, sourceUrl: v })} placeholder="https://…" />
            </Field>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <Btn label={addSaving ? "Adding…" : "Add college"} onClick={addCollege} />
            <Btn label="Cancel" onClick={() => setShowAdd(false)} variant="ghost" />
          </div>
        </Card>
      )}

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search private colleges…" />
        <Select value={province} onChange={(v) => { setProvince(v); setPage(1); }} options={[
          { label: "All provinces", value: "" },
          ...PROVINCES.map((p) => ({ label: p, value: p })),
        ]} />
        <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[
          { label: "All statuses",  value: "" },
          { label: "In Review",     value: "IN_REVIEW" },
          { label: "Verified",      value: "VERIFIED" },
        ]} />
      </div>

      <Card noPad>
        {loading ? <Spinner /> : colleges.length === 0 ? (
          <Empty message="No private colleges yet — add them manually using the button above" />
        ) : (
          <Table headers={["College", "Province", "Website", "Status", ""]}>
            {colleges.map((c) => (
              <TableRow
                key={c.id}
                cols={[
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "10px", padding: "1px 5px", borderRadius: "4px", background: "rgba(139,92,246,0.12)", color: "#8b5cf6", fontWeight: 700 }}>PRIVATE</span>
                    <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{c.name}{c.abbreviation ? ` (${c.abbreviation})` : ""}</span>
                  </div>,
                  c.province,
                  c.website
                    ? <a href={c.website} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "var(--color-accent)" }}>🔗 visit</a>
                    : <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>—</span>,
                  statusBadge(c.status),
                  <Btn label="View / Edit →" onClick={() => setSelected(c)} variant="ghost" small />,
                ]}
              />
            ))}
          </Table>
        )}
        <Pagination page={page} pages={pagination.pages} onPage={setPage} />
      </Card>

      {selected && (
        <CollegePanel
          college={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => { load(); setSelected(null); }}
        />
      )}
    </div>
  );
}
