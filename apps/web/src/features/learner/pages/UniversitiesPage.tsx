"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, ExternalLink, BookOpen, Loader2 } from "lucide-react";
import apiClient from "@/api/client";

const T = {
  primary:   "#5B4FCF",
  secondary: "#EEE9FF",
  coral:     "#F97066",
  teal:      "#0D9488",
  sidebar:   "#1E1875",
  bg:        "#FAFAF9",
  card:      "#FFFFFF",
  fg:        "#1A1535",
  muted:     "#7A7499",
  border:    "rgba(91,79,207,0.12)",
};

// ── Types ──────────────────────────────────────────────────────────────────────

interface University {
  id:           string;
  name:         string;
  abbreviation: string | null;
  province:     string;
  type:         string | null;
  website:      string | null;
  logoUrl:      string | null;
  status:       string;
  _count:       { programmes: number };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  traditional:              "Traditional University",
  comprehensive:            "Comprehensive University",
  university_of_technology: "University of Technology",
};

const TYPE_COLOR: Record<string, string> = {
  traditional:              "#5B4FCF",
  comprehensive:            "#0D9488",
  university_of_technology: "#F97066",
};

function typeLabel(type: string | null) {
  return type ? (TYPE_LABEL[type] ?? type) : "University";
}

function typeColor(type: string | null) {
  return type ? (TYPE_COLOR[type] ?? T.primary) : T.primary;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function UniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [search,       setSearch]       = useState("");
  const [province,     setProvince]     = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    const params = new URLSearchParams({ status: "APPROVED,VERIFIED" });
    if (province) params.set("province", province);

    apiClient
      .get(`/universities?${params.toString()}`)
      .then((res) => {
        setUniversities(res.data?.data?.universities ?? []);
      })
      .catch(() => setError("Could not load universities. Please try again."))
      .finally(() => setLoading(false));
  }, [province]);

  const filtered = universities.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.abbreviation?.toLowerCase().includes(q) ?? false) ||
      u.province.toLowerCase().includes(q)
    );
  });

  const provinces = Array.from(new Set(universities.map((u) => u.province))).sort();

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px 48px", fontFamily: "inherit" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: T.fg }}>Universities</h1>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: T.muted }}>
          Explore institutions to find the right fit for your career path.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 420 }}>
            <Search size={16} color={T.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search by name or province…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px 10px 36px",
                border: `1px solid ${T.border}`, borderRadius: 10,
                fontSize: 14, color: T.fg, background: T.card,
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Province filter */}
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            style={{
              padding: "10px 14px", border: `1px solid ${T.border}`,
              borderRadius: 10, fontSize: 14,
              color: province ? T.fg : T.muted,
              background: T.card, outline: "none", cursor: "pointer", minWidth: 180,
            }}
          >
            <option value="">All provinces</option>
            {provinces.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 12 }}>
          <Loader2 size={22} color={T.primary} style={{ animation: "spin 0.8s linear infinite" }} />
          <span style={{ color: T.muted, fontSize: 14 }}>Loading universities…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{
          background: "#FEF2F2", borderRadius: 12, padding: "16px 20px",
          border: "1px solid #FECACA", color: "#DC2626", fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>🏛️</p>
          <p style={{ fontWeight: 700, fontSize: 16, color: T.fg, marginBottom: 6 }}>No universities found</p>
          <p style={{ color: T.muted, fontSize: 14 }}>
            {search || province
              ? "Try clearing the search or province filter."
              : "No approved universities have been added yet."}
          </p>
        </div>
      )}

      {/* Count */}
      {!loading && !error && filtered.length > 0 && (
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>
          Showing <strong style={{ color: T.fg }}>{filtered.length}</strong>{" "}
          institution{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="uni-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          {filtered.map((u) => <UniCard key={u.id} uni={u} />)}
        </div>
      )}

      <style>{`
        @media (max-width: 900px) { .uni-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 600px) { .uni-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────────

function UniCard({ uni }: { uni: University }) {
  const color  = typeColor(uni.type);
  const label  = typeLabel(uni.type);
  const abbrev = uni.abbreviation ? ` (${uni.abbreviation})` : "";

  return (
    <div
      style={{
        background: T.card, borderRadius: 14, padding: 20,
        border: `1px solid ${T.border}`, display: "flex",
        flexDirection: "column", gap: 12,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(91,79,207,0.1)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* Logo / initial + name */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {uni.logoUrl ? (
          <img
            src={uni.logoUrl} alt={uni.name}
            style={{ width: 48, height: 48, borderRadius: 10, objectFit: "contain", background: "#F3F4F6", padding: 4, flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 48, height: 48, borderRadius: 10, flexShrink: 0,
            background: `${color}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 20, color,
          }}>
            {(uni.abbreviation ?? uni.name).charAt(0)}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: "0 0 5px", fontSize: 14, fontWeight: 700, color: T.fg, lineHeight: 1.3 }}>
            {uni.name}{abbrev}
          </h3>
          <span style={{
            fontSize: 11, fontWeight: 600, color,
            background: `${color}14`, borderRadius: 99, padding: "2px 8px",
          }}>
            {label}
          </span>
        </div>
      </div>

      {/* Province */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.muted }}>
        <MapPin size={13} />
        <span>{uni.province}</span>
      </div>

      {/* Programmes */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.muted }}>
        <BookOpen size={13} />
        <span>
          {uni.type === "university_of_technology" ? "Diplomas & BTech" : "Degrees & qualifications"}
          {uni._count.programmes > 0 && (
            <span style={{ marginLeft: 4, color: T.primary, fontWeight: 600 }}>
              · {uni._count.programmes} programme{uni._count.programmes !== 1 ? "s" : ""}
            </span>
          )}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        <button style={{
          flex: 1, background: "none", color: T.primary,
          border: `1.5px solid ${T.primary}`, borderRadius: 8,
          padding: "8px 0", fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}>
          View Programmes
        </button>
        {uni.website && (
          <a
            href={uni.website}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 38, borderRadius: 8, border: `1.5px solid ${T.border}`,
              color: T.muted, textDecoration: "none", flexShrink: 0,
            }}
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
}
