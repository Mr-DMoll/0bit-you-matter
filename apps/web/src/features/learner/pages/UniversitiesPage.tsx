"use client";

import { useState, useEffect } from "react";
import apiClient from "@/api/client";

export function UniversitiesPage() {
  const [universities, setUniversities] = useState<any[]>([]);
  const [programmes, setProgrammes]     = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [aps, setAps]                   = useState("");
  const [selected, setSelected]         = useState<any | null>(null);

  useEffect(() => {
    Promise.all([
      apiClient.get("/universities"),
      apiClient.get("/programmes"),
    ])
      .then(([uRes, pRes]) => {
        setUniversities(uRes.data.data ?? []);
        setProgrammes(pRes.data.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredUnis = universities.filter((u) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.city?.toLowerCase().includes(search.toLowerCase())
  );

  const uniProgrammes = (uniId: string) => {
    const list = programmes.filter((p) => p.universityId === uniId);
    if (aps) return list.filter((p) => p.apsMin <= parseInt(aps, 10));
    return list;
  };

  if (selected) {
    const progs = uniProgrammes(selected.id);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--color-text-muted)", padding: 0, alignSelf: "flex-start" }}>
          ← Back
        </button>

        <div style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", borderRadius: "16px", padding: "20px", color: "#fff" }}>
          <p style={{ fontSize: "12px", opacity: 0.8, marginBottom: "4px" }}>{selected.city ?? ""} {selected.province ?? ""}</p>
          <h1 style={{ fontSize: "20px", fontWeight: 800 }}>{selected.name}</h1>
          {selected.website && (
            <p style={{ fontSize: "12px", opacity: 0.7, marginTop: "6px" }}>{selected.website}</p>
          )}
        </div>

        {/* APS filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--color-bg-secondary)", borderRadius: "10px", padding: "10px 14px", border: "1px solid var(--color-border)" }}>
          <span style={{ fontSize: "13px", color: "var(--color-text-muted)", flexShrink: 0 }}>My APS:</span>
          <input
            type="number" value={aps} onChange={(e) => setAps(e.target.value)}
            placeholder="e.g. 28"
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: "14px", color: "var(--color-text-primary)" }}
          />
          {aps && <span style={{ fontSize: "11px", color: "#22c55e" }}>Showing programmes you qualify for</span>}
        </div>

        <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{progs.length} programme{progs.length !== 1 ? "s" : ""}{aps ? " you qualify for" : ""}</p>

        {progs.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "24px 0" }}>
            {aps ? "No programmes match your APS. Try a higher APS or remove the filter." : "No programmes listed yet."}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {progs.map((p) => (
              <div key={p.id} style={{ padding: "14px 16px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", flex: 1, paddingRight: "8px" }}>{p.name}</p>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-accent)", flexShrink: 0 }}>APS {p.apsMin}</span>
                </div>
                {p.faculty && <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{p.faculty}</p>}
                {p.duration && <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{p.duration} year{p.duration > 1 ? "s" : ""}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)" }}>Universities</h1>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "4px" }}>Find the right university and check if you qualify</p>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or city…"
          style={{ flex: 1, padding: "10px 14px", fontSize: "14px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "10px", color: "var(--color-text-primary)", outline: "none" }}
        />
        <input
          type="number" value={aps} onChange={(e) => setAps(e.target.value)}
          placeholder="APS"
          style={{ width: "68px", padding: "10px 10px", fontSize: "14px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "10px", color: "var(--color-text-primary)", outline: "none" }}
        />
      </div>
      {aps && <p style={{ fontSize: "11px", color: "#22c55e", marginTop: "-8px" }}>Filtering by APS ≥ {aps}</p>}

      {loading ? (
        <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "40px 0" }}>Loading…</p>
      ) : filteredUnis.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "40px 0" }}>No universities found</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filteredUnis.map((u) => {
            const count = uniProgrammes(u.id).length;
            return (
              <button
                key={u.id}
                onClick={() => setSelected(u)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", background: "var(--color-bg-secondary)",
                  border: "1px solid var(--color-border)", borderRadius: "12px",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{u.name}</p>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    {[u.city, u.province].filter(Boolean).join(", ")}
                    {aps && count > 0 ? ` · ${count} programme${count !== 1 ? "s" : ""} you qualify for` : ""}
                  </p>
                </div>
                <span style={{ color: "var(--color-text-muted)", fontSize: "18px" }}>›</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
