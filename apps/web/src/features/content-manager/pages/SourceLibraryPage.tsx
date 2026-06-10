"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, Table, TableRow, Badge,
  Spinner, Empty, Select, Btn, SearchInput, timeAgo,
} from "@/features/admin/components/AdminShell";

const RELIABILITY_COLOR: Record<string, string> = {
  HIGH: "#22c55e", MEDIUM: "#f59e0b", LOW: "#ef4444",
};

const FIELD = (label: string, value: string, onChange: (v: string) => void, placeholder = "") => (
  <div>
    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "4px" }}>{label}</label>
    <input
      value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "8px 12px", fontSize: "13px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }}
    />
  </div>
);

export function SourceLibraryPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const [name, setName]             = useState("");
  const [url, setUrl]               = useState("");
  const [description, setDescription] = useState("");
  const [reliability, setReliability] = useState("HIGH");
  const [sourceType, setSourceType] = useState("GOVERNMENT");

  const load = useCallback(() => {
    setLoading(true);
    apiClient.get("/content/sources")
      .then((r) => setSources(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = sources.filter((s) => {
    const matchSearch      = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchReliability = !filter || s.reliability === filter;
    return matchSearch && matchReliability;
  });

  const handleCreate = async () => {
    if (!name.trim() || !url.trim()) { setError("Name and URL are required"); return; }
    setSaving(true); setError("");
    try {
      await apiClient.post("/content/sources", { name, url, description, reliability, sourceType });
      setShowForm(false);
      setName(""); setUrl(""); setDescription(""); setReliability("HIGH"); setSourceType("GOVERNMENT");
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to create source");
    } finally { setSaving(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Source Library"
        subtitle="Official sources used by the Web Research Agent — SA government, universities and trusted institutions"
        action={<Btn label="+ Add source" onClick={() => setShowForm(true)} />}
      />

      {showForm && (
        <Card title="Add source">
          {error && (
            <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#ef4444", marginBottom: "14px" }}>
              {error}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {FIELD("Name *", name, setName, "e.g. South African Qualifications Authority")}
            {FIELD("URL *", url, setUrl, "https://www.saqa.org.za")}
            {FIELD("Description", description, setDescription, "What data this source provides")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "4px" }}>Reliability</label>
                <Select value={reliability} onChange={setReliability} options={[
                  { label: "High",   value: "HIGH" },
                  { label: "Medium", value: "MEDIUM" },
                  { label: "Low",    value: "LOW" },
                ]} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "4px" }}>Type</label>
                <Select value={sourceType} onChange={setSourceType} options={[
                  { label: "Government",  value: "GOVERNMENT" },
                  { label: "University",  value: "UNIVERSITY" },
                  { label: "Industry",    value: "INDUSTRY" },
                  { label: "Other",       value: "OTHER" },
                ]} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <Btn label={saving ? "Saving…" : "Add source"} onClick={handleCreate} />
              <Btn label="Cancel" onClick={() => { setShowForm(false); setError(""); }} variant="ghost" />
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", gap: "10px" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search sources…" />
        <Select value={filter} onChange={setFilter} options={[
          { label: "All reliability", value: "" },
          { label: "High",            value: "HIGH" },
          { label: "Medium",          value: "MEDIUM" },
          { label: "Low",             value: "LOW" },
        ]} />
      </div>

      <Card noPad>
        {loading ? <Spinner /> : filtered.length === 0 ? <Empty message="No sources found" /> : (
          <Table headers={["Name", "Type", "Reliability", "URL", "Updated"]}>
            {filtered.map((s) => (
              <TableRow
                key={s.id}
                cols={[
                  <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{s.name}</span>,
                  s.sourceType ?? "—",
                  <Badge label={s.reliability} color={RELIABILITY_COLOR[s.reliability] ?? "#94a3b8"} />,
                  <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#6366f1", textDecoration: "none", maxWidth: "200px", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.url}
                  </a>,
                  timeAgo(s.updatedAt),
                ]}
              />
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
