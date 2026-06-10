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
const UNI_TYPES = [
  { label: "Comprehensive",            value: "COMPREHENSIVE" },
  { label: "Traditional",              value: "TRADITIONAL" },
  { label: "University of Technology", value: "UNIVERSITY_OF_TECHNOLOGY" },
  { label: "Distance Learning",        value: "DISTANCE" },
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

// ── Programme row (edit inline) ───────────────────────────────────────────────

function ProgrammeRow({ prog, onSave, onDelete }: { prog: any; onSave: (id: string, data: any) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState({ name: prog.name, faculty: prog.faculty ?? "", apsMin: String(prog.apsMin ?? ""), nqfLevel: String(prog.nqfLevel ?? ""), duration: String(prog.duration ?? ""), subjectRequirements: prog.subjectRequirements ?? "" });
  const [saving, setSaving]     = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave(prog.id, { ...form, apsMin: form.apsMin ? parseInt(form.apsMin) : undefined, nqfLevel: form.nqfLevel ? parseInt(form.nqfLevel) : undefined, duration: form.duration ? parseInt(form.duration) : undefined });
    setSaving(false);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--color-border)", gap: "8px" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)" }}>{prog.name}</p>
          <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
            {[prog.faculty, prog.apsMin ? `APS ${prog.apsMin}` : null, prog.duration ? `${prog.duration}yr` : null, prog.nqfLevel ? `NQF ${prog.nqfLevel}` : null].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          <button onClick={() => setEditing(true)} style={{ padding: "3px 8px", fontSize: "11px", background: "none", border: "1px solid var(--color-border)", borderRadius: "4px", cursor: "pointer", color: "var(--color-text-muted)" }}>Edit</button>
          <button onClick={() => onDelete(prog.id)} style={{ padding: "3px 8px", fontSize: "11px", background: "none", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "4px", cursor: "pointer", color: "#ef4444" }}>×</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "10px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-accent)", borderRadius: "var(--radius-sm)", marginBottom: "8px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
        <Field label="Programme name">
          <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        </Field>
        <Field label="Faculty">
          <Input value={form.faculty} onChange={(v) => setForm({ ...form, faculty: v })} placeholder="e.g. Faculty of Science" />
        </Field>
        <Field label="APS min">
          <Input value={form.apsMin} onChange={(v) => setForm({ ...form, apsMin: v })} type="number" placeholder="e.g. 28" />
        </Field>
        <Field label="Duration (years)">
          <Input value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} type="number" placeholder="e.g. 3" />
        </Field>
        <Field label="NQF level">
          <Input value={form.nqfLevel} onChange={(v) => setForm({ ...form, nqfLevel: v })} type="number" placeholder="e.g. 7" />
        </Field>
      </div>
      <Field label="Subject requirements">
        <Input value={form.subjectRequirements} onChange={(v) => setForm({ ...form, subjectRequirements: v })} placeholder="e.g. Maths 5, Physical Science 4" />
      </Field>
      <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
        <Btn label={saving ? "Saving…" : "Save"} onClick={save} small />
        <Btn label="Cancel" onClick={() => setEditing(false)} variant="ghost" small />
      </div>
    </div>
  );
}

// ── University detail panel ───────────────────────────────────────────────────

function UniversityPanel({ uni, onClose, onUpdated }: { uni: any; onClose: () => void; onUpdated: () => void }) {
  const [detail, setDetail]       = useState<any>(null);
  const [editMode, setEditMode]   = useState(false);
  const [form, setForm]           = useState<any>({});
  const [saving, setSaving]       = useState(false);
  const [addProg, setAddProg]     = useState(false);
  const [newProg, setNewProg]     = useState({ name: "", faculty: "", apsMin: "", nqfLevel: "", duration: "", subjectRequirements: "" });
  const [addingSaving, setAddingSaving] = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    apiClient.get(`/universities/${uni.id}`)
      .then((r) => { setDetail(r.data.data); setForm({ name: r.data.data.name, abbreviation: r.data.data.abbreviation ?? "", province: r.data.data.province, type: r.data.data.type ?? "", website: r.data.data.website ?? "" }); })
      .catch(() => {});
  }, [uni.id]);

  const saveUni = async () => {
    setSaving(true); setError("");
    try {
      await apiClient.patch(`/universities/${uni.id}`, form);
      setEditMode(false);
      onUpdated();
    } catch (e: any) { setError(e?.response?.data?.message ?? "Save failed"); }
    setSaving(false);
  };

  const saveProg = async (id: string, data: any) => {
    await apiClient.patch(`/universities/programmes/${id}`, data);
    const r = await apiClient.get(`/universities/${uni.id}`);
    setDetail(r.data.data);
  };

  const deleteProg = async (id: string) => {
    if (!confirm("Delete this programme?")) return;
    await apiClient.patch(`/universities/programmes/${id}`, { status: "ARCHIVED" });
    const r = await apiClient.get(`/universities/${uni.id}`);
    setDetail(r.data.data);
  };

  const addProgSave = async () => {
    if (!newProg.name) return;
    setAddingSaving(true);
    try {
      await apiClient.post(`/universities/${uni.id}/programmes`, { ...newProg, apsMin: newProg.apsMin ? parseInt(newProg.apsMin) : undefined, nqfLevel: newProg.nqfLevel ? parseInt(newProg.nqfLevel) : undefined, duration: newProg.duration ? parseInt(newProg.duration) : undefined });
      setAddProg(false);
      setNewProg({ name: "", faculty: "", apsMin: "", nqfLevel: "", duration: "", subjectRequirements: "" });
      const r = await apiClient.get(`/universities/${uni.id}`);
      setDetail(r.data.data);
    } catch {}
    setAddingSaving(false);
  };

  const programmes = detail?.programmes?.filter((p: any) => p.status !== "ARCHIVED") ?? [];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 40 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "540px", maxWidth: "90vw", background: "var(--color-card-bg)", borderLeft: "1px solid var(--color-card-border)", zIndex: 50, overflowY: "auto", display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", position: "sticky", top: 0, background: "var(--color-card-bg)", zIndex: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "2px" }}>
              {statusBadge(uni.status)}
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{uni.province}</span>
            </div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--color-text-primary)" }}>{uni.name}</h2>
            {uni.abbreviation && <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{uni.abbreviation}</p>}
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <Btn label={editMode ? "Cancel" : "Edit"} onClick={() => setEditMode(!editMode)} variant="ghost" small />
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--color-text-muted)" }}>×</button>
          </div>
        </div>

        <div style={{ padding: "20px", flex: 1 }}>
          {error && <div style={{ padding: "8px 12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#ef4444", marginBottom: "12px" }}>{error}</div>}

          {/* Edit form */}
          {editMode ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <Field label="Name">
                <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field label="Abbreviation">
                  <Input value={form.abbreviation} onChange={(v) => setForm({ ...form, abbreviation: v })} placeholder="e.g. UCT" />
                </Field>
                <Field label="Province">
                  <Select value={form.province} onChange={(v) => setForm({ ...form, province: v })}
                    options={PROVINCES.map((p) => ({ label: p, value: p }))} />
                </Field>
                <Field label="Type">
                  <Select value={form.type} onChange={(v) => setForm({ ...form, type: v })}
                    options={[{ label: "Select…", value: "" }, ...UNI_TYPES]} />
                </Field>
                <Field label="Website">
                  <Input value={form.website} onChange={(v) => setForm({ ...form, website: v })} placeholder="https://…" />
                </Field>
              </div>
              <Btn label={saving ? "Saving…" : "Save changes"} onClick={saveUni} />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              {[
                { label: "Type",     value: uni.type?.replace(/_/g, " "), link: null },
                { label: "Province", value: uni.province,                  link: null },
                { label: "Status",   value: uni.status,                    link: null },
                { label: "Website",  value: uni.website,                   link: uni.website },
              ].filter(i => i.value).map(({ label, value, link }) => (
                <div key={label} style={{ padding: "10px 12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{label}</p>
                  {link
                    ? <a href={link} target="_blank" rel="noreferrer" style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-accent)", marginTop: "2px", display: "block", wordBreak: "break-all" }}>{value}</a>
                    : <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)", marginTop: "2px" }}>{value}</p>
                  }
                </div>
              ))}
            </div>
          )}

          {/* Programmes */}
          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                Programmes ({programmes.length})
              </p>
              <Btn label="+ Add programme" onClick={() => setAddProg(!addProg)} variant="ghost" small />
            </div>

            {addProg && (
              <div style={{ padding: "12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-accent)", borderRadius: "var(--radius-sm)", marginBottom: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                  <Field label="Name *"><Input value={newProg.name} onChange={(v) => setNewProg({ ...newProg, name: v })} placeholder="e.g. BSc Computer Science" /></Field>
                  <Field label="Faculty"><Input value={newProg.faculty} onChange={(v) => setNewProg({ ...newProg, faculty: v })} placeholder="Faculty of Science" /></Field>
                  <Field label="APS min"><Input value={newProg.apsMin} onChange={(v) => setNewProg({ ...newProg, apsMin: v })} type="number" placeholder="28" /></Field>
                  <Field label="Duration (yrs)"><Input value={newProg.duration} onChange={(v) => setNewProg({ ...newProg, duration: v })} type="number" placeholder="3" /></Field>
                  <Field label="NQF level"><Input value={newProg.nqfLevel} onChange={(v) => setNewProg({ ...newProg, nqfLevel: v })} type="number" placeholder="7" /></Field>
                </div>
                <Field label="Subject requirements">
                  <Input value={newProg.subjectRequirements} onChange={(v) => setNewProg({ ...newProg, subjectRequirements: v })} placeholder="Maths 5, Physical Science 4" />
                </Field>
                <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                  <Btn label={addingSaving ? "Adding…" : "Add programme"} onClick={addProgSave} small />
                  <Btn label="Cancel" onClick={() => setAddProg(false)} variant="ghost" small />
                </div>
              </div>
            )}

            {!detail ? (
              <Spinner />
            ) : programmes.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", fontStyle: "italic" }}>No programmes yet — add manually or generate via AI Pipeline.</p>
            ) : (
              programmes.map((p: any) => (
                <ProgrammeRow key={p.id} prog={p} onSave={saveProg} onDelete={deleteProg} />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AdminUniversityDBPage() {
  const [universities, setUniversities] = useState<any[]>([]);
  const [pagination, setPagination]     = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [province, setProvince]         = useState("");
  const [status, setStatus]             = useState("");
  const [page, setPage]                 = useState(1);
  const [selected, setSelected]         = useState<any | null>(null);
  const [showAdd, setShowAdd]           = useState(false);
  const [addForm, setAddForm]           = useState({ name: "", abbreviation: "", province: "Gauteng", type: "COMPREHENSIVE", website: "" });
  const [addSaving, setAddSaving]       = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params: any = { page };
    if (province) params.province = province;
    if (status)   params.status   = status;
    apiClient.get("/universities", { params })
      .then((r) => { setUniversities(r.data.data.universities ?? []); setPagination(r.data.data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, province, status]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? universities.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.abbreviation?.toLowerCase().includes(search.toLowerCase()))
    : universities;

  const addUniversity = async () => {
    if (!addForm.name) return;
    setAddSaving(true);
    try {
      await apiClient.post("/universities", addForm);
      setShowAdd(false);
      setAddForm({ name: "", abbreviation: "", province: "Gauteng", type: "COMPREHENSIVE", website: "" });
      load();
    } catch {}
    setAddSaving(false);
  };

  const totalVerified   = universities.filter((u) => u.status === "VERIFIED").length;
  const totalProgrammes = universities.reduce((s, u) => s + (u._count?.programmes ?? 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="University Database"
        subtitle={`${pagination.total} universities · ${totalProgrammes} programmes`}
        action={<Btn label="+ Add university" onClick={() => setShowAdd(!showAdd)} variant="ghost" />}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: "12px" }}>
        <StatCard label="Universities" value={pagination.total} />
        <StatCard label="Verified"     value={totalVerified}   accent="#22c55e" />
        <StatCard label="Programmes"   value={totalProgrammes} accent="#6366f1" />
      </div>

      {showAdd && (
        <Card title="Add university">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Field label="Name *"><Input value={addForm.name} onChange={(v) => setAddForm({ ...addForm, name: v })} placeholder="University of…" /></Field>
            <Field label="Abbreviation"><Input value={addForm.abbreviation} onChange={(v) => setAddForm({ ...addForm, abbreviation: v })} placeholder="UCT" /></Field>
            <Field label="Province">
              <Select value={addForm.province} onChange={(v) => setAddForm({ ...addForm, province: v })} options={PROVINCES.map((p) => ({ label: p, value: p }))} />
            </Field>
            <Field label="Type">
              <Select value={addForm.type} onChange={(v) => setAddForm({ ...addForm, type: v })} options={UNI_TYPES} />
            </Field>
            <Field label="Website"><Input value={addForm.website} onChange={(v) => setAddForm({ ...addForm, website: v })} placeholder="https://…" /></Field>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <Btn label={addSaving ? "Adding…" : "Add university"} onClick={addUniversity} />
            <Btn label="Cancel" onClick={() => setShowAdd(false)} variant="ghost" />
          </div>
        </Card>
      )}

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search universities…" />
        <Select value={province} onChange={(v) => { setProvince(v); setPage(1); }} options={[
          { label: "All provinces", value: "" },
          ...PROVINCES.map((p) => ({ label: p, value: p })),
        ]} />
        <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[
          { label: "All statuses",  value: "" },
          { label: "Verified",      value: "VERIFIED" },
          { label: "AI Generated",  value: "AI_GENERATED" },
          { label: "Approved",      value: "APPROVED" },
        ]} />
      </div>

      <Card noPad>
        {loading ? <Spinner /> : filtered.length === 0 ? <Empty message="No universities found" /> : (
          <Table headers={["Name", "Abbr.", "Province", "Type", "Website", "Programmes", "Status", ""]}>
            {filtered.map((u) => (
              <TableRow
                key={u.id}
                cols={[
                  <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{u.name}</span>,
                  u.abbreviation ?? "—",
                  u.province,
                  u.type?.replace(/_/g, " ") ?? "—",
                  u.website
                    ? <a href={u.website} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "var(--color-accent)" }}>🔗 visit</a>
                    : <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>—</span>,
                  <span style={{ fontWeight: 500, color: u._count?.programmes > 0 ? "var(--color-accent)" : "var(--color-text-muted)" }}>{u._count?.programmes ?? 0}</span>,
                  statusBadge(u.status),
                  <Btn label="View / Edit →" onClick={() => setSelected(u)} variant="ghost" small />,
                ]}
              />
            ))}
          </Table>
        )}
        <Pagination page={page} pages={pagination.pages} onPage={setPage} />
      </Card>

      {selected && (
        <UniversityPanel
          uni={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => { load(); setSelected(null); }}
        />
      )}
    </div>
  );
}
