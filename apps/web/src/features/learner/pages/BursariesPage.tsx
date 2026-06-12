"use client";

import { useState, useEffect } from "react";
import { Clock, ExternalLink, Search, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import apiClient from "@/api/client";

const T = {
  primary:  "#5B4FCF",
  secondary:"#EEE9FF",
  coral:    "#F97066",
  teal:     "#0D9488",
  sidebar:  "#1E1875",
  bg:       "#FAFAF9",
  card:     "#FFFFFF",
  fg:       "#1A1535",
  muted:    "#7A7499",
  border:   "rgba(91,79,207,0.12)",
};

// Colour palette for field pills — cycles if there are more fields than colours
const FIELD_PALETTE = [
  { bg: T.secondary,  color: T.primary   },
  { bg: "#FEF3C7",    color: "#D97706"   },
  { bg: "#D1FAE5",    color: "#059669"   },
  { bg: "#EDE9FE",    color: "#7C3AED"   },
  { bg: "#FEE2E2",    color: "#DC2626"   },
  { bg: "#E0F2FE",    color: "#0284C7"   },
  { bg: "#FCE7F3",    color: "#DB2777"   },
];

function fieldStyle(field: string, allFields: string[]) {
  const idx = allFields.indexOf(field);
  return FIELD_PALETTE[idx % FIELD_PALETTE.length] ?? FIELD_PALETTE[0];
}

// Urgent = closing within 7 days
function isUrgent(closeDate: string | null): boolean {
  if (!closeDate) return false;
  const diff = new Date(closeDate).getTime() - Date.now();
  return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

function formatDeadline(closeDate: string | null): string | null {
  if (!closeDate) return null;
  return new Date(closeDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function googleSearch(b: any) {
  const q = `${b.name} bursary South Africa${b.provider ? " " + b.provider : ""}`;
  window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank", "noopener,noreferrer");
}

export function BursariesPage() {
  const [bursaries,      setBursaries]      = useState<any[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filterOpen,     setFilterOpen]     = useState(false);

  useEffect(() => {
    apiClient.get("/bursaries")
      .then((r) => setBursaries(r.data.data.bursaries ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // All distinct fields across loaded bursaries (flattened from fieldsOfStudy arrays)
  const allFields: string[] = [...new Set(
    bursaries.flatMap((b) => Array.isArray(b.fieldsOfStudy) ? b.fieldsOfStudy : [])
  )].sort();

  // Only show field filter when there are 2+ distinct fields
  const showFieldFilter = allFields.length > 1;

  const toggleField = (f: string) =>
    setSelectedFields((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);

  const filtered = bursaries.filter((b) => {
    if (selectedFields.length === 0) return true;
    const fields: string[] = Array.isArray(b.fieldsOfStudy) ? b.fieldsOfStudy : [];
    return selectedFields.some((f) => fields.includes(f));
  });

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px 48px", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: T.fg }}>Funding For You</h1>
          <p style={{ margin: 0, fontSize: 14, color: T.muted }}>
            {loading ? "Loading bursaries…" : "Verified bursaries matched to South African learners."}
          </p>
        </div>
        {!loading && (
          <div style={{ marginLeft: "auto", background: T.primary, color: "#fff", borderRadius: 99, padding: "4px 14px", fontSize: 13, fontWeight: 600 }}>
            {filtered.length} {filtered.length === 1 ? "bursary" : "bursaries"}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, color: T.muted, fontSize: 14 }}>
          Loading…
        </div>
      ) : bursaries.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, color: T.muted, gap: 8 }}>
          <span style={{ fontSize: 32 }}>🎓</span>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: T.fg }}>No bursaries available yet</p>
          <p style={{ margin: 0, fontSize: 13 }}>Check back soon — our reviewers are verifying new bursaries.</p>
        </div>
      ) : (
        <div className="bursaries-layout" style={{ display: "grid", gridTemplateColumns: showFieldFilter ? "220px 1fr" : "1fr", gap: 20 }}>

          {/* Sidebar — only rendered when 2+ fields exist */}
          {showFieldFilter && (
            <div className="bursary-filter-panel" style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, alignSelf: "start", position: "sticky", top: 20, overflow: "hidden" }}>
              {/* Toggle header (always visible) */}
              <button
                className="bursary-filter-toggle"
                onClick={() => setFilterOpen(o => !o)}
                style={{ display: "none", width: "100%", background: "none", border: "none", cursor: "pointer", padding: "14px 16px", textAlign: "left" }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <SlidersHorizontal size={15} color={T.primary} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.fg }}>
                    Filter by field
                    {selectedFields.length > 0 && (
                      <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, background: T.primary, color: "#fff", borderRadius: 99, padding: "2px 8px" }}>
                        {selectedFields.length}
                      </span>
                    )}
                  </span>
                  <span style={{ marginLeft: "auto" }}>
                    {filterOpen ? <ChevronUp size={16} color={T.muted} /> : <ChevronDown size={16} color={T.muted} />}
                  </span>
                </span>
              </button>
              {/* Filter body */}
              <div className="bursary-filter-body" style={{ padding: 18 }}>
                <h4 className="bursary-filter-heading" style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: T.fg }}>Filter by field</h4>
                {allFields.map((f) => {
                  const fc = fieldStyle(f, allFields);
                  return (
                    <label key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(f)}
                        onChange={() => toggleField(f)}
                        style={{ accentColor: T.primary, width: 15, height: 15 }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 500, color: T.fg }}>{f}</span>
                      <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: fc.bg, color: fc.color }}>
                        {bursaries.filter((b) => Array.isArray(b.fieldsOfStudy) && b.fieldsOfStudy.includes(f)).length}
                      </span>
                    </label>
                  );
                })}
                {selectedFields.length > 0 && (
                  <button
                    onClick={() => setSelectedFields([])}
                    style={{ marginTop: 8, width: "100%", padding: "7px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, color: T.muted, cursor: "pointer", fontWeight: 600 }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Cards grid */}
          <div className="bursary-cards" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignContent: "start" }}>
            {filtered.length === 0 ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px 0", color: T.muted, fontSize: 14 }}>
                No bursaries match the selected fields.
              </div>
            ) : filtered.map((b) => {
              const fields: string[] = Array.isArray(b.fieldsOfStudy) ? b.fieldsOfStudy : [];
              const urgent = isUrgent(b.closeDate);
              const deadline = formatDeadline(b.closeDate);

              return (
                <div
                  key={b.id}
                  style={{
                    background: T.card, borderRadius: 14, padding: 18,
                    border: `1px solid ${urgent ? "rgba(249,112,102,0.35)" : T.border}`,
                    display: "flex", flexDirection: "column", gap: 10,
                    boxShadow: urgent ? "0 0 0 2px rgba(249,112,102,0.08)" : "none",
                  }}
                >
                  {/* Row 1: provider + urgent pill */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.fg }}>{b.provider}</span>
                    {urgent && (
                      <span style={{ fontSize: 11, fontWeight: 700, background: "#FEE2E2", color: T.coral, borderRadius: 99, padding: "3px 9px", flexShrink: 0 }}>
                        ⚡ Urgent
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.fg, lineHeight: 1.4 }}>{b.name}</p>

                  {/* Field pills */}
                  {fields.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {fields.map((f) => {
                        const fc = fieldStyle(f, allFields);
                        return (
                          <span key={f} style={{ fontSize: 11, fontWeight: 600, background: fc.bg, color: fc.color, borderRadius: 99, padding: "3px 10px" }}>
                            {f}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Description */}
                  {b.description && (
                    <p style={{ margin: 0, fontSize: 12, color: T.muted, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {b.description}
                    </p>
                  )}

                  {/* Deadline */}
                  {deadline && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: urgent ? T.coral : T.muted, fontWeight: urgent ? 600 : 400 }}>
                      <Clock size={13} />
                      <span>Closes {deadline}{urgent ? " — closing soon!" : ""}</span>
                    </div>
                  )}

                  {/* Two equal action buttons */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: "auto" }}>
                    <button
                      onClick={() => googleSearch(b)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "9px 0", borderRadius: 8, border: `1.5px solid ${T.primary}`,
                        background: "transparent", color: T.primary,
                        fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      <Search size={13} /> Google it
                    </button>
                    <button
                      onClick={() => b.applicationUrl && window.open(b.applicationUrl, "_blank", "noopener,noreferrer")}
                      disabled={!b.applicationUrl}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "9px 0", borderRadius: 8, border: "none",
                        background: b.applicationUrl ? T.primary : "var(--color-bg-subtle, #eee)",
                        color: b.applicationUrl ? "#fff" : T.muted,
                        fontSize: 12, fontWeight: 700,
                        cursor: b.applicationUrl ? "pointer" : "not-allowed",
                        transition: "all 0.15s",
                      }}
                    >
                      Apply direct <ExternalLink size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .bursaries-layout        { grid-template-columns: 1fr !important; }
          .bursary-cards           { grid-template-columns: 1fr !important; }
          .bursary-filter-panel    { position: static !important; }
          .bursary-filter-toggle   { display: flex !important; }
          .bursary-filter-heading  { display: none !important; }
          .bursary-filter-body     { padding: ${filterOpen ? "0 16px 14px" : "0"} !important; display: ${filterOpen ? "block" : "none"} !important; }
        }
      `}</style>
    </div>
  );
}
