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

const PROGRAMME_TYPE_COLOURS: Record<string, string> = {
  NCV:          "#6366f1",
  NATED:        "#f59e0b",
  OCCUPATIONAL: "#22c55e",
};

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
function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width: "100%", padding: "7px 10px", fontSize: "13px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
  );
}

// ── Programme row (inline edit) ───────────────────────────────────────────────

function ProgrammeRow({ prog, onSave, onDelete }: { prog: any; onSave: (id: string, d: any) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({
    name: prog.name, programmeType: prog.programmeType, field: prog.field,
    ncvLevel: String(prog.ncvLevel ?? ""), natedLevel: prog.natedLevel ?? "",
    duration: String(prog.duration ?? ""), entryRequirement: prog.entryRequirement ?? "",
    careerOutcomes: (prog.careerOutcomes ?? []).join(", "),
    subjectRequirements: prog.subjectRequirements ?? "",
  });
  const [saving, setSaving] = useState(false);

  const typeColor = PROGRAMME_TYPE_COLOURS[prog.programmeType] ?? "#94a3b8";

  if (!editing) {
    return (
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--color-border)", gap: "8px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
            <span style={{ padding: "1px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, background: `${typeColor}20`, color: typeColor }}>{prog.programmeType}</span>
            {prog.ncvLevel  && <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Level {prog.ncvLevel}</span>}
            {prog.natedLevel && <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{prog.natedLevel}</span>}
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>· {prog.field}</span>
          </div>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)" }}>{prog.name}</p>
          {prog.entryRequirement && <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "1px" }}>Entry: {prog.entryRequirement}</p>}
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          <button onClick={() => setEditing(true)} style={{ padding: "3px 8px", fontSize: "11px", background: "none", border: "1px solid var(--color-border)", borderRadius: "4px", cursor: "pointer", color: "var(--color-text-muted)" }}>Edit</button>
          <button onClick={() => onDelete(prog.id)} style={{ padding: "3px 8px", fontSize: "11px", background: "none", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "4px", cursor: "pointer", color: "#ef4444" }}>×</button>
        </div>
      </div>
    );
  }

  const save = async () => {
    setSaving(true);
    await onSave(prog.id, {
      ...form,
      ncvLevel:      form.ncvLevel  ? parseInt(form.ncvLevel)  : null,
      duration:      form.duration  ? parseInt(form.duration)  : null,
      natedLevel:    form.natedLevel || null,
      careerOutcomes: form.careerOutcomes.split(",").map((s: string) => s.trim()).filter(Boolean),
    });
    setSaving(false); setEditing(false);
  };

  return (
    <div style={{ padding: "10px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-accent)", borderRadius: "var(--radius-sm)", marginBottom: "8px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
        <Field label="Name"><Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} /></Field>
        <Field label="Field"><Input value={form.field} onChange={(v) => setForm({ ...form, field: v })} placeholder="Engineering Studies" /></Field>
        <Field label="Type">
          <Select value={form.programmeType} onChange={(v) => setForm({ ...form, programmeType: v })}
            options={[{ label:"NCV",value:"NCV"},{ label:"NATED",value:"NATED"},{ label:"Occupational",value:"OCCUPATIONAL"}]} />
        </Field>
        <Field label="NCV Level (2–4)"><Input value={form.ncvLevel} onChange={(v) => setForm({ ...form, ncvLevel: v })} type="number" placeholder="4" /></Field>
        <Field label="NATED Level (N1–N6)"><Input value={form.natedLevel} onChange={(v) => setForm({ ...form, natedLevel: v })} placeholder="N3" /></Field>
        <Field label="Duration (months)"><Input value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} type="number" placeholder="12" /></Field>
      </div>
      <Field label="Entry requirement"><Input value={form.entryRequirement} onChange={(v) => setForm({ ...form, entryRequirement: v })} placeholder="Grade 9 pass" /></Field>
      <div style={{ marginTop: "8px" }}>
        <Field label="Career outcomes (comma-separated)"><Input value={form.careerOutcomes} onChange={(v) => setForm({ ...form, careerOutcomes: v })} placeholder="Electrician, Electrical Engineer" /></Field>
      </div>
      <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
        <Btn label={saving ? "Saving…" : "Save"} onClick={save} small />
        <Btn label="Cancel" onClick={() => setEditing(false)} variant="ghost" small />
      </div>
    </div>
  );
}

// ── College panel ─────────────────────────────────────────────────────────────

function CollegePanel({ college, onClose, onUpdated }: { college: any; onClose: () => void; onUpdated: () => void }) {
  const [detail, setDetail]     = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm]         = useState({ name: college.name, abbreviation: college.abbreviation ?? "", province: college.province, website: college.website ?? "", sourceUrl: college.sourceUrl ?? "", verifiedNote: college.verifiedNote ?? "" });
  const [saving, setSaving]     = useState(false);
  const [addProg, setAddProg]   = useState(false);
  const [newProg, setNewProg]   = useState({ name: "", programmeType: "NCV", field: "", ncvLevel: "", natedLevel: "", duration: "", entryRequirement: "", careerOutcomes: "", subjectRequirements: "" });
  const [addSaving, setAddSaving] = useState(false);

  const reload = useCallback(() => {
    apiClient.get(`/tvet/${college.id}`).then((r) => setDetail(r.data.data)).catch(() => {});
  }, [college.id]);

  useEffect(() => { reload(); }, [reload]);

  const saveCollege = async () => {
    setSaving(true);
    try { await apiClient.patch(`/tvet/${college.id}`, form); setEditMode(false); onUpdated(); }
    catch {}
    setSaving(false);
  };

  const saveProg = async (id: string, data: any) => {
    await apiClient.patch(`/tvet/programmes/${id}`, data);
    reload();
  };
  const deleteProg = async (id: string) => {
    if (!confirm("Archive this programme?")) return;
    await apiClient.patch(`/tvet/programmes/${id}`, { status: "ARCHIVED" });
    reload();
  };
  const addProgSave = async () => {
    if (!newProg.name || !newProg.field) return;
    setAddSaving(true);
    try {
      await apiClient.post(`/tvet/${college.id}/programmes`, {
        ...newProg,
        ncvLevel: newProg.ncvLevel ? parseInt(newProg.ncvLevel) : undefined,
        duration: newProg.duration ? parseInt(newProg.duration) : undefined,
        natedLevel: newProg.natedLevel || undefined,
        careerOutcomes: newProg.careerOutcomes.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setAddProg(false);
      setNewProg({ name: "", programmeType: "NCV", field: "", ncvLevel: "", natedLevel: "", duration: "", entryRequirement: "", careerOutcomes: "", subjectRequirements: "" });
      reload();
    } catch {}
    setAddSaving(false);
  };

  const programmes = detail?.programmes?.filter((p: any) => p.status !== "ARCHIVED") ?? [];
  const ncv   = programmes.filter((p: any) => p.programmeType === "NCV");
  const nated = programmes.filter((p: any) => p.programmeType === "NATED");
  const other = programmes.filter((p: any) => !["NCV","NATED"].includes(p.programmeType));

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 40 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "560px", maxWidth: "92vw", background: "var(--color-card-bg)", borderLeft: "1px solid var(--color-card-border)", zIndex: 50, overflowY: "auto", display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", position: "sticky", top: 0, background: "var(--color-card-bg)", zIndex: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "2px" }}>
              {statusBadge(college.status)}
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{college.province}</span>
            </div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--color-text-primary)" }}>{college.name}</h2>
            {programmes.length > 0 && <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{programmes.length} programmes · {ncv.length} NCV · {nated.length} NATED</p>}
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <Btn label={editMode ? "Cancel" : "Edit"} onClick={() => setEditMode(!editMode)} variant="ghost" small />
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--color-text-muted)" }}>×</button>
          </div>
        </div>

        <div style={{ padding: "20px", flex: 1 }}>
          {/* Edit form */}
          {editMode && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field label="Name"><Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} /></Field>
                <Field label="Abbreviation"><Input value={form.abbreviation} onChange={(v) => setForm({ ...form, abbreviation: v })} placeholder="e.g. Orbit TVET" /></Field>
                <Field label="Province">
                  <Select value={form.province} onChange={(v) => setForm({ ...form, province: v })} options={PROVINCES.map((p) => ({ label: p, value: p }))} />
                </Field>
                <Field label="Website"><Input value={form.website} onChange={(v) => setForm({ ...form, website: v })} placeholder="https://…" /></Field>
              </div>
              <Field label="Source URL (for learner verification)">
                <Input value={form.sourceUrl} onChange={(v) => setForm({ ...form, sourceUrl: v })} placeholder="https://tvetcolleges.edu.za/college/…" />
              </Field>
              <Field label="Verified note">
                <Input value={form.verifiedNote} onChange={(v) => setForm({ ...form, verifiedNote: v })} placeholder="Confirmed against DHET college list 2025" />
              </Field>
              <Btn label={saving ? "Saving…" : "Save"} onClick={saveCollege} />
            </div>
          )}

          {/* Info cards */}
          {!editMode && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
              {[
                { label: "Province", value: college.province,     link: null },
                { label: "Website",  value: college.website,      link: college.website },
                { label: "Source",   value: college.sourceUrl ? "DHET College List" : null, link: college.sourceUrl },
                { label: "Verified", value: college.verifiedNote, link: null },
              ].filter(i => i.value).map(({ label, value, link }) => (
                <div key={label} style={{ padding: "8px 12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{label}</p>
                  {link
                    ? <a href={link} target="_blank" rel="noreferrer" style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-accent)", marginTop: "2px", display: "block", wordBreak: "break-all" }}>{value}</a>
                    : <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-primary)", marginTop: "2px", wordBreak: "break-all" }}>{value}</p>
                  }
                </div>
              ))}
            </div>
          )}

          {/* Verification action */}
          {!editMode && college.status !== "VERIFIED" && (
            <div style={{ padding: "12px 14px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "var(--radius-sm)", marginBottom: "16px" }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#22c55e", marginBottom: "4px" }}>Ready to verify?</p>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "10px" }}>
                Check the website link, confirm this college is still active on the DHET list, then mark as verified for learners.
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <Btn label="✓ Mark as Verified" onClick={async () => {
                  await apiClient.patch(`/tvet/${college.id}`, { status: "VERIFIED" });
                  onUpdated();
                  onClose();
                }} small />
                <Btn label="Archive" onClick={async () => {
                  if (!confirm("Archive this college?")) return;
                  await apiClient.patch(`/tvet/${college.id}`, { status: "ARCHIVED" });
                  onUpdated();
                  onClose();
                }} variant="ghost" small />
              </div>
            </div>
          )}

          {/* Programmes */}
          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>Programmes ({programmes.length})</p>
              <Btn label="+ Add" onClick={() => setAddProg(!addProg)} variant="ghost" small />
            </div>

            {addProg && (
              <div style={{ padding: "12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-accent)", borderRadius: "var(--radius-sm)", marginBottom: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                  <Field label="Name *"><Input value={newProg.name} onChange={(v) => setNewProg({ ...newProg, name: v })} placeholder="NCV Engineering Studies Level 4" /></Field>
                  <Field label="Field *"><Input value={newProg.field} onChange={(v) => setNewProg({ ...newProg, field: v })} placeholder="Engineering Studies" /></Field>
                  <Field label="Type">
                    <Select value={newProg.programmeType} onChange={(v) => setNewProg({ ...newProg, programmeType: v })}
                      options={[{label:"NCV",value:"NCV"},{label:"NATED",value:"NATED"},{label:"Occupational",value:"OCCUPATIONAL"}]} />
                  </Field>
                  <Field label="NCV Level"><Input value={newProg.ncvLevel} onChange={(v) => setNewProg({ ...newProg, ncvLevel: v })} type="number" placeholder="4" /></Field>
                  <Field label="NATED Level"><Input value={newProg.natedLevel} onChange={(v) => setNewProg({ ...newProg, natedLevel: v })} placeholder="N3" /></Field>
                  <Field label="Duration (months)"><Input value={newProg.duration} onChange={(v) => setNewProg({ ...newProg, duration: v })} type="number" placeholder="12" /></Field>
                </div>
                <Field label="Entry requirement"><Input value={newProg.entryRequirement} onChange={(v) => setNewProg({ ...newProg, entryRequirement: v })} placeholder="Grade 9 pass" /></Field>
                <div style={{ marginTop: "8px" }}><Field label="Career outcomes (comma-sep)"><Input value={newProg.careerOutcomes} onChange={(v) => setNewProg({ ...newProg, careerOutcomes: v })} placeholder="Electrician, Electrical Technician" /></Field></div>
                <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                  <Btn label={addSaving ? "Adding…" : "Add"} onClick={addProgSave} small />
                  <Btn label="Cancel" onClick={() => setAddProg(false)} variant="ghost" small />
                </div>
              </div>
            )}

            {!detail ? <Spinner /> : programmes.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", fontStyle: "italic" }}>No programmes yet — use AI Pipeline to bulk generate.</p>
            ) : (
              <>
                {ncv.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", marginBottom: "6px" }}>NCV ({ncv.length})</p>
                    {ncv.map((p: any) => <ProgrammeRow key={p.id} prog={p} onSave={saveProg} onDelete={deleteProg} />)}
                  </div>
                )}
                {nated.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", marginBottom: "6px" }}>NATED ({nated.length})</p>
                    {nated.map((p: any) => <ProgrammeRow key={p.id} prog={p} onSave={saveProg} onDelete={deleteProg} />)}
                  </div>
                )}
                {other.length > 0 && (
                  <div>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "#22c55e", textTransform: "uppercase", marginBottom: "6px" }}>Other ({other.length})</p>
                    {other.map((p: any) => <ProgrammeRow key={p.id} prog={p} onSave={saveProg} onDelete={deleteProg} />)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AdminTVETCollegesPage() {
  const [colleges, setColleges]       = useState<any[]>([]);
  const [pagination, setPagination]   = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [province, setProvince]       = useState("");
  const [status, setStatus]           = useState("");
  const [page, setPage]               = useState(1);
  const [selected, setSelected]       = useState<any | null>(null);
  const [showAdd, setShowAdd]         = useState(false);
  const [addForm, setAddForm]         = useState({ name: "", abbreviation: "", province: "Gauteng", website: "", sourceUrl: "https://tvetcolleges.edu.za" });
  const [addSaving, setAddSaving]     = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params: any = { page };
    if (province) params.province = province;
    if (status)   params.status   = status;
    if (search)   params.search   = search;
    apiClient.get("/tvet", { params })
      .then((r) => { setColleges(r.data.data.colleges ?? []); setPagination(r.data.data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, province, status, search]);

  useEffect(() => { load(); }, [load]);

  const totalProgrammes = colleges.reduce((s, c) => s + (c._count?.programmes ?? 0), 0);

  const addCollege = async () => {
    if (!addForm.name) return;
    setAddSaving(true);
    try {
      await apiClient.post("/tvet", addForm);
      setShowAdd(false);
      setAddForm({ name: "", abbreviation: "", province: "Gauteng", website: "", sourceUrl: "https://tvetcolleges.edu.za" });
      load();
    } catch {}
    setAddSaving(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="TVET Colleges"
        subtitle={`${pagination.total} colleges · ${totalProgrammes} programmes · Source: DHET / tvetcolleges.edu.za`}
        action={<Btn label="+ Add college" onClick={() => setShowAdd(!showAdd)} variant="ghost" />}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: "12px" }}>
        <StatCard label="Colleges"   value={pagination.total} />
        <StatCard label="Programmes" value={totalProgrammes} accent="#6366f1" />
        <StatCard label="Verified"   value={colleges.filter(c => c.status === "VERIFIED").length} accent="#22c55e" />
      </div>

      {showAdd && (
        <Card title="Add TVET college">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Field label="Name *"><Input value={addForm.name} onChange={(v) => setAddForm({ ...addForm, name: v })} placeholder="Orbit TVET College" /></Field>
            <Field label="Abbreviation"><Input value={addForm.abbreviation} onChange={(v) => setAddForm({ ...addForm, abbreviation: v })} placeholder="Orbit" /></Field>
            <Field label="Province">
              <Select value={addForm.province} onChange={(v) => setAddForm({ ...addForm, province: v })} options={PROVINCES.map((p) => ({ label: p, value: p }))} />
            </Field>
            <Field label="Website"><Input value={addForm.website} onChange={(v) => setAddForm({ ...addForm, website: v })} placeholder="https://…" /></Field>
            <Field label="Source URL">
              <Input value={addForm.sourceUrl} onChange={(v) => setAddForm({ ...addForm, sourceUrl: v })} placeholder="https://tvetcolleges.edu.za/…" />
            </Field>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <Btn label={addSaving ? "Adding…" : "Add college"} onClick={addCollege} />
            <Btn label="Cancel" onClick={() => setShowAdd(false)} variant="ghost" />
          </div>
        </Card>
      )}

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search colleges…" />
        <Select value={province} onChange={(v) => { setProvince(v); setPage(1); }} options={[
          { label: "All provinces", value: "" },
          ...PROVINCES.map((p) => ({ label: p, value: p })),
        ]} />
        <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[
          { label: "All statuses",  value: "" },
          { label: "AI Generated",  value: "AI_GENERATED" },
          { label: "Verified",      value: "VERIFIED" },
        ]} />
      </div>

      <Card noPad>
        {loading ? <Spinner /> : colleges.length === 0 ? <Empty message="No TVET colleges yet — use AI Pipeline to generate, or add manually" /> : (
          <Table headers={["College", "Province", "NCV Progs", "NATED Progs", "Status", ""]}>
            {colleges.map((c) => {
              const ncvCount   = 0; // count comes via _count.programmes — breakdown needs separate query
              return (
                <TableRow
                  key={c.id}
                  cols={[
                    <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{c.name}{c.abbreviation ? ` (${c.abbreviation})` : ""}</span>,
                    c.province,
                    <span style={{ fontWeight: 500, color: c._count?.programmes > 0 ? "#6366f1" : "var(--color-text-muted)" }}>{c._count?.programmes ?? 0} total</span>,
                    c.website ? <a href={c.website} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "var(--color-accent)" }}>🔗 website</a> : "—",
                    statusBadge(c.status),
                    <Btn label="View / Edit →" onClick={() => setSelected(c)} variant="ghost" small />,
                  ]}
                />
              );
            })}
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
