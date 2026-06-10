"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/client";

const RIASEC_COLORS: Record<string, string> = {
  R: "#ef4444", I: "#3b82f6", A: "#f59e0b",
  S: "#22c55e",  E: "#6366f1", C: "#8b5cf6",
};

export function ExploreCareersPage() {
  const router = useRouter();
  const [clusters, setClusters]   = useState<any[]>([]);
  const [careers, setCareers]     = useState<any[]>([]);
  const [clusterId, setClusterId] = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState<any | null>(null);
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get("/careers/clusters"),
      apiClient.get("/careers", { params: { status: "VERIFIED" } }),
    ])
      .then(([cRes, crRes]) => {
        setClusters(cRes.data.data ?? []);
        setCareers(crRes.data.data.careers ?? crRes.data.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = careers.filter((c) => {
    const matchCluster = !clusterId || c.clusterId === clusterId;
    const matchSearch  = !search || c.title.toLowerCase().includes(search.toLowerCase());
    return matchCluster && matchSearch;
  });

  const saveCareer = async (careerId: string) => {
    setSaving(true);
    try { await apiClient.post("/learner/saved-careers", { careerId }); }
    catch {}
    finally { setSaving(false); }
  };

  if (selected) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--color-text-muted)", padding: 0, alignSelf: "flex-start" }}>
          ← Back
        </button>

        <div style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: "16px", padding: "20px", color: "#fff" }}>
          <p style={{ fontSize: "12px", opacity: 0.8, marginBottom: "4px" }}>Career profile</p>
          <h1 style={{ fontSize: "22px", fontWeight: 800 }}>{selected.title}</h1>
          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            {(selected.riasecCodes ?? []).map((c: string) => (
              <span key={c} style={{ padding: "2px 8px", background: "rgba(255,255,255,0.2)", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>{c}</span>
            ))}
          </div>
        </div>

        {selected.earningsMin && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ padding: "14px", background: "var(--color-bg-secondary)", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
              <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Salary range</p>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "2px" }}>
                R{(selected.earningsMin / 1000).toFixed(0)}k – R{(selected.earningsMax / 1000).toFixed(0)}k/yr
              </p>
            </div>
            {selected.nqfLevelMin && (
              <div style={{ padding: "14px", background: "var(--color-bg-secondary)", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
                <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Min NQF level</p>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "2px" }}>NQF {selected.nqfLevelMin}</p>
              </div>
            )}
          </div>
        )}

        {selected.overview && (
          <div style={{ background: "var(--color-bg-secondary)", borderRadius: "12px", padding: "16px", border: "1px solid var(--color-border)" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>Overview</p>
            <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{selected.overview}</p>
          </div>
        )}

        {selected.dayInTheLife && (
          <div style={{ background: "var(--color-bg-secondary)", borderRadius: "12px", padding: "16px", border: "1px solid var(--color-border)" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>Day in the life</p>
            <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{selected.dayInTheLife}</p>
          </div>
        )}

        {selected.howToGetThere && (
          <div style={{ background: "var(--color-bg-secondary)", borderRadius: "12px", padding: "16px", border: "1px solid var(--color-border)" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>How to get there</p>
            <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{selected.howToGetThere}</p>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => saveCareer(selected.id)}
            disabled={saving}
            style={{ flex: 1, padding: "12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "var(--color-text-secondary)" }}
          >
            ♡ Save career
          </button>
          <button
            onClick={() => router.push("/learner/universities")}
            style={{ flex: 1, padding: "12px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
          >
            Find universities →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)" }}>Explore Careers</h1>

      <input
        value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Search careers…"
        style={{ width: "100%", padding: "10px 14px", fontSize: "14px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "10px", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }}
      />

      {/* cluster pills */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
        {[{ id: null, name: "All" }, ...clusters].map((cl) => (
          <button
            key={cl.id ?? "all"}
            onClick={() => setClusterId(cl.id)}
            style={{
              padding: "6px 14px", borderRadius: "20px", border: "1px solid var(--color-border)",
              background: clusterId === cl.id ? "var(--color-accent)" : "var(--color-bg-secondary)",
              color: clusterId === cl.id ? "#fff" : "var(--color-text-secondary)",
              fontSize: "12px", fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            {cl.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "40px 0" }}>Loading careers…</p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "40px 0" }}>No careers found</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px", background: "var(--color-bg-secondary)",
                border: "1px solid var(--color-border)", borderRadius: "12px",
                cursor: "pointer", textAlign: "left",
              }}
            >
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{c.title}</p>
                <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                  {(c.riasecCodes ?? []).slice(0, 3).map((code: string) => (
                    <span key={code} style={{ width: "18px", height: "18px", borderRadius: "50%", background: RIASEC_COLORS[code] ?? "#94a3b8", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: "#fff" }}>{code}</span>
                  ))}
                  {c.earningsMin && <span style={{ fontSize: "11px", color: "var(--color-text-muted)", marginLeft: "4px" }}>R{(c.earningsMin/1000).toFixed(0)}k+</span>}
                </div>
              </div>
              <span style={{ color: "var(--color-text-muted)", fontSize: "18px" }}>›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
