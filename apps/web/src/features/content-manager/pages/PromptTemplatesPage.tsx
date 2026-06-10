"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, Table, TableRow, Badge, statusBadge,
  Spinner, Empty, Select, Btn, SearchInput, timeAgo,
} from "@/features/admin/components/AdminShell";

const CONTENT_TYPES = [
  { label: "All types",            value: "" },
  { label: "Career",               value: "CAREER" },
  { label: "University Programme", value: "UNIVERSITY_PROGRAMME" },
  { label: "Bursary",              value: "BURSARY" },
  { label: "Assessment Question",  value: "ASSESSMENT_QUESTION" },
];

const FIELD = (label: string, value: string, onChange: (v: string) => void, placeholder = "") => (
  <div>
    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "4px" }}>{label}</label>
    <input
      value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "8px 12px", fontSize: "13px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }}
    />
  </div>
);

export function PromptTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("");
  const [search, setSearch]       = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const [name, setName]             = useState("");
  const [contentType, setContentType] = useState("CAREER");
  const [promptText, setPromptText] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    apiClient.get("/content/prompts")
      .then((r) => setTemplates(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = templates.filter((t) => {
    const matchType  = !filter || t.contentType === filter;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const handleCreate = async () => {
    if (!name.trim() || !promptText.trim()) { setError("Name and prompt text are required"); return; }
    setSaving(true); setError("");
    try {
      await apiClient.post("/content/prompts", { name, contentType, promptText, description });
      setShowForm(false);
      setName(""); setPromptText(""); setDescription("");
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to create template");
    } finally { setSaving(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Prompt Templates"
        subtitle="Versioned prompts used by the Claude AI generation agent — each save increments the version"
        action={<Btn label="+ New template" onClick={() => setShowForm(true)} />}
      />

      {showForm && (
        <Card title="Create new template">
          {error && (
            <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#ef4444", marginBottom: "14px" }}>
              {error}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {FIELD("Template name *", name, setName, "e.g. Career Detail Generator")}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "4px" }}>Content type *</label>
              <Select value={contentType} onChange={setContentType} options={CONTENT_TYPES.slice(1)} />
            </div>
            {FIELD("Description", description, setDescription, "Short summary of what this prompt generates")}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "4px" }}>Prompt text *</label>
              <textarea
                value={promptText} onChange={(e) => setPromptText(e.target.value)}
                placeholder="You are a career guidance expert for South African learners. Generate a detailed career profile for {{title}} in the {{cluster}} cluster. Include: description, key duties, required qualifications, typical APS score, salary range and career pathways. Return valid JSON."
                rows={8}
                style={{ width: "100%", padding: "10px 12px", fontSize: "12px", fontFamily: "monospace", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", resize: "vertical", outline: "none", boxSizing: "border-box" }}
              />
              <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                Use {"{{variable}}"} placeholders — they are filled from the job's parameters object.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <Btn label={saving ? "Creating…" : "Create template"} onClick={handleCreate} />
              <Btn label="Cancel" onClick={() => { setShowForm(false); setError(""); }} variant="ghost" />
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", gap: "10px" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search templates…" />
        <Select value={filter} onChange={setFilter} options={CONTENT_TYPES} />
      </div>

      <Card noPad>
        {loading ? <Spinner /> : filtered.length === 0 ? <Empty message="No templates found" /> : (
          <Table headers={["Name", "Type", "Version", "Description", "Active", "Updated"]}>
            {filtered.map((t) => (
              <TableRow
                key={t.id}
                cols={[
                  <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{t.name}</span>,
                  t.contentType,
                  <Badge label={`v${t.version}`} color="#6366f1" />,
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)", maxWidth: "240px", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.description ?? "—"}
                  </span>,
                  t.isActive
                    ? <Badge label="Active" color="#22c55e" />
                    : <Badge label="Inactive" color="#94a3b8" />,
                  timeAgo(t.updatedAt),
                ]}
              />
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
