"use client";

import { useState, useEffect } from "react";
import apiClient from "@/api/client";

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:  "#22c55e",
  CLOSING: "#f59e0b",
  CLOSED:  "#ef4444",
};

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export function BursariesPage() {
  const [bursaries, setBursaries] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState<"ALL" | "ACTIVE" | "CLOSING">("ALL");
  const [selected, setSelected]   = useState<any | null>(null);

  useEffect(() => {
    apiClient.get("/bursaries", { params: { status: "VERIFIED" } })
      .then((r) => setBursaries(r.data.data?.bursaries ?? r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = bursaries.filter((b) => {
    const days   = daysUntil(b.deadline);
    const status = days === null ? "ACTIVE" : days < 0 ? "CLOSED" : days <= 14 ? "CLOSING" : "ACTIVE";
    const matchFilter = filter === "ALL" || status === filter;
    const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.provider?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch && status !== "CLOSED";
  });

  if (selected) {
    const days   = daysUntil(selected.deadline);
    const status = days === null ? "ACTIVE" : days < 0 ? "CLOSED" : days <= 14 ? "CLOSING" : "ACTIVE";

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--color-text-muted)", padding: 0, alignSelf: "flex-start" }}>
          ← Back
        </button>

        <div style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", borderRadius: "16px", padding: "20px", color: "#fff" }}>
          <p style={{ fontSize: "12px", opacity: 0.8, marginBottom: "4px" }}>{selected.provider ?? "Bursary"}</p>
          <h1 style={{ fontSize: "20px", fontWeight: 800 }}>{selected.title}</h1>
          {days !== null && days >= 0 && (
            <p style={{ fontSize: "12px", opacity: 0.85, marginTop: "6px" }}>
              {days === 0 ? "Closes today!" : `${days} day${days !== 1 ? "s" : ""} left to apply`}
            </p>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {selected.amount && (
            <div style={{ padding: "14px", background: "var(--color-bg-secondary)", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
              <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Amount</p>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "2px" }}>R{Number(selected.amount).toLocaleString()}</p>
            </div>
          )}
          {selected.deadline && (
            <div style={{ padding: "14px", background: "var(--color-bg-secondary)", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
              <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Deadline</p>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "2px" }}>
                {new Date(selected.deadline).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          )}
        </div>

        {selected.eligibilityCriteria && (
          <div style={{ background: "var(--color-bg-secondary)", borderRadius: "12px", padding: "16px", border: "1px solid var(--color-border)" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>Eligibility</p>
            <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{selected.eligibilityCriteria}</p>
          </div>
        )}

        {selected.description && (
          <div style={{ background: "var(--color-bg-secondary)", borderRadius: "12px", padding: "16px", border: "1px solid var(--color-border)" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>About</p>
            <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{selected.description}</p>
          </div>
        )}

        {selected.applicationUrl && (
          <a
            href={selected.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "block", padding: "14px", background: STATUS_COLOR[status] ?? "var(--color-accent)", color: "#fff", borderRadius: "12px", textAlign: "center", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}
          >
            Apply now →
          </a>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)" }}>Bursaries</h1>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "4px" }}>Find funding for your studies</p>
      </div>

      <input
        value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Search bursaries…"
        style={{ width: "100%", padding: "10px 14px", fontSize: "14px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "10px", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }}
      />

      <div style={{ display: "flex", gap: "8px" }}>
        {(["ALL", "ACTIVE", "CLOSING"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px", borderRadius: "20px", border: "1px solid var(--color-border)",
              background: filter === f ? "var(--color-accent)" : "var(--color-bg-secondary)",
              color: filter === f ? "#fff" : "var(--color-text-secondary)",
              fontSize: "12px", fontWeight: 500, cursor: "pointer",
            }}
          >
            {f === "CLOSING" ? "Closing soon" : f[0] + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "40px 0" }}>Loading bursaries…</p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "40px 0" }}>No bursaries found</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map((b) => {
            const days   = daysUntil(b.deadline);
            const status = days === null ? "ACTIVE" : days < 0 ? "CLOSED" : days <= 14 ? "CLOSING" : "ACTIVE";
            return (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                style={{
                  display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                  padding: "14px 16px", background: "var(--color-bg-secondary)",
                  border: "1px solid var(--color-border)", borderRadius: "12px",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <div style={{ flex: 1, paddingRight: "8px" }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{b.title}</p>
                  {b.provider && <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{b.provider}</p>}
                  <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
                    {b.amount && <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-secondary)" }}>R{Number(b.amount).toLocaleString()}</span>}
                    {days !== null && days >= 0 && (
                      <span style={{ fontSize: "11px", fontWeight: 600, color: STATUS_COLOR[status] }}>
                        {days === 0 ? "Closes today" : `${days}d left`}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ color: "var(--color-text-muted)", fontSize: "18px", flexShrink: 0 }}>›</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
