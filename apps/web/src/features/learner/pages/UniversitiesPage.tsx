"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, ExternalLink, Loader2 } from "lucide-react";
import apiClient from "@/api/client";
import { InfoBanner } from "@/features/learner/components/InfoBanner";

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

const TABS = ["Universities", "TVET Colleges", "Private Colleges"];

// ── Types ──────────────────────────────────────────────────────────────────────

interface Institution {
  id:           string;
  name:         string;
  abbreviation: string | null;
  province:     string;
  type?:        string | null;   // universities
  collegeType?: string;          // tvet
  website:      string | null;
  logoUrl:      string | null;
  status:       string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const UNI_TYPE_LABEL: Record<string, string> = {
  traditional:              "Traditional University",
  comprehensive:            "Comprehensive University",
  university_of_technology: "University of Technology",
};

const UNI_TYPE_COLOR: Record<string, string> = {
  traditional:              "#5B4FCF",
  comprehensive:            "#0D9488",
  university_of_technology: "#F97066",
};

function uniTypeLabel(type: string | null | undefined) {
  return type ? (UNI_TYPE_LABEL[type] ?? type) : "University";
}
function uniTypeColor(type: string | null | undefined) {
  return type ? (UNI_TYPE_COLOR[type] ?? T.primary) : T.primary;
}

// ── Hook: fetch per tab ────────────────────────────────────────────────────────

function useInstitutions(tab: string, province: string) {
  const [data,    setData]    = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    let url: string;
    const statuses = "APPROVED,VERIFIED";

    if (tab === "Universities") {
      const p = new URLSearchParams({ status: statuses });
      if (province) p.set("province", province);
      url = `/universities?${p}`;
    } else {
      const collegeType = tab === "TVET Colleges" ? "PUBLIC" : "PRIVATE";
      const p = new URLSearchParams({ status: statuses, collegeType });
      if (province) p.set("province", province);
      url = `/tvet?${p}`;
    }

    apiClient
      .get(url)
      .then((res) => {
        const key = tab === "Universities" ? "universities" : "colleges";
        setData(res.data?.data?.[key] ?? []);
      })
      .catch(() => setError("Could not load data. Please try again."))
      .finally(() => setLoading(false));
  }, [tab, province]);

  return { data, loading, error };
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function UniversitiesPage() {
  const [tab,      setTab]      = useState("Universities");
  const [search,   setSearch]   = useState("");
  const [province, setProvince] = useState("");

  const { data, loading, error } = useInstitutions(tab, province);

  // Client-side search filter
  const filtered = data.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.abbreviation?.toLowerCase().includes(q) ?? false) ||
      u.province.toLowerCase().includes(q)
    );
  });

  // Unique provinces from loaded data for the filter dropdown
  const provinces = Array.from(new Set(data.map((u) => u.province))).sort();

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px 48px", fontFamily: "inherit" }}>

      <InfoBanner
        id="universities"
        icon="🏫"
        title="Finding the right institution"
        body="South Africa has 26 public universities and hundreds of TVET colleges. Browse here to find one that offers programmes for your career goal, then visit their website for application details and fees."
        tip="Check your career's roadmap page to see which universities offer programmes for your specific career."
      />

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: T.fg }}>Universities &amp; Colleges</h1>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: T.muted }}>Find the right institution for your career path.</p>

        <div style={{ position: "relative", maxWidth: 420 }}>
          <Search size={16} color={T.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search institutions..."
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
      </div>

      {/* Info banner */}
      <div style={{ background: T.secondary, borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: T.primary }}>
        ℹ️ Showing approved institutions with key information to help you plan your path.
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 20, background: T.card,
        borderRadius: 10, padding: 4, border: `1px solid ${T.border}`,
        alignSelf: "flex-start", width: "fit-content",
      }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSearch(""); setProvince(""); }}
            style={{
              background: tab === t ? T.primary : "none",
              color:      tab === t ? "#fff" : T.muted,
              border: "none", borderRadius: 8, padding: "8px 18px",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Province filter — only show once data is loaded */}
      {!loading && data.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            style={{
              padding: "8px 14px", border: `1px solid ${T.border}`,
              borderRadius: 10, fontSize: 13,
              color: province ? T.fg : T.muted,
              background: T.card, outline: "none", cursor: "pointer",
            }}
          >
            <option value="">All provinces</option>
            {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 12 }}>
          <Loader2 size={22} color={T.primary} style={{ animation: "spin 0.8s linear infinite" }} />
          <span style={{ color: T.muted, fontSize: 14 }}>Loading {tab.toLowerCase()}…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ background: "#FEF2F2", borderRadius: 12, padding: "16px 20px", border: "1px solid #FECACA", color: "#DC2626", fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>
            {tab === "Universities" ? "🏛️" : tab === "TVET Colleges" ? "🎓" : "🏫"}
          </p>
          <p style={{ fontWeight: 700, fontSize: 16, color: T.fg, marginBottom: 6 }}>
            {search ? "No results match your search" : `No ${tab.toLowerCase()} available yet`}
          </p>
          <p style={{ color: T.muted, fontSize: 14 }}>
            {search
              ? "Try a different search term."
              : `${tab} will appear here once they've been reviewed and approved.`}
          </p>
        </div>
      )}

      {/* Count */}
      {!loading && !error && filtered.length > 0 && (
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>
          Showing <strong style={{ color: T.fg }}>{filtered.length}</strong>{" "}
          {tab === "Universities" ? "university" : "college"}{filtered.length !== 1 ? (tab === "Universities" ? " universities" : " colleges") : ""}
        </p>
      )}

      {/* Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="uni-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          {filtered.map((u) =>
            tab === "Universities"
              ? <UniCard      key={u.id} uni={u} />
              : <CollegeCard  key={u.id} college={u} tab={tab} />
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 900px) { .uni-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 600px) { .uni-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

// ── University card ────────────────────────────────────────────────────────────

function UniCard({ uni }: { uni: Institution }) {
  const color  = uniTypeColor(uni.type);
  const label  = uniTypeLabel(uni.type);
  const abbrev = uni.abbreviation ? ` (${uni.abbreviation})` : "";

  return (
    <div
      style={{ background: T.card, borderRadius: 14, padding: 20, border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 10 }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(91,79,207,0.1)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {uni.logoUrl ? (
          <img src={uni.logoUrl} alt={uni.name} style={{ width: 46, height: 46, borderRadius: 10, objectFit: "contain", background: "#F3F4F6", padding: 4, flexShrink: 0 }} />
        ) : (
          <div style={{ width: 46, height: 46, borderRadius: 10, flexShrink: 0, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, color }}>
            {(uni.abbreviation ?? uni.name).charAt(0)}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: "0 0 5px", fontSize: 14, fontWeight: 700, color: T.fg, lineHeight: 1.3 }}>
            {uni.name}{abbrev}
          </h3>
          <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}14`, borderRadius: 99, padding: "2px 8px" }}>
            {label}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.muted }}>
        <MapPin size={13} /><span>{uni.province}</span>
      </div>

      <div style={{ marginTop: "auto" }}>
        {uni.website ? (
          <a
            href={uni.website} target="_blank" rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              width: "100%", padding: "9px 0", borderRadius: 8,
              background: T.primary, color: "#fff",
              fontWeight: 600, fontSize: 13, textDecoration: "none",
            }}
          >
            Visit Website <ExternalLink size={13} />
          </a>
        ) : (
          <div style={{ fontSize: 12, color: T.muted, textAlign: "center", padding: "6px 0" }}>No website available</div>
        )}
      </div>
    </div>
  );
}

// ── TVET / Private College card ────────────────────────────────────────────────

function CollegeCard({ college, tab }: { college: Institution; tab: string }) {
  const color  = tab === "Private Colleges" ? T.coral : T.teal;
  const label  = tab === "Private Colleges" ? "Private College" : "TVET College";
  const abbrev = college.abbreviation ? ` (${college.abbreviation})` : "";

  return (
    <div
      style={{ background: T.card, borderRadius: 14, padding: 20, border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 10 }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(91,79,207,0.1)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {college.logoUrl ? (
          <img src={college.logoUrl} alt={college.name} style={{ width: 46, height: 46, borderRadius: 10, objectFit: "contain", background: "#F3F4F6", padding: 4, flexShrink: 0 }} />
        ) : (
          <div style={{ width: 46, height: 46, borderRadius: 10, flexShrink: 0, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, color }}>
            {(college.abbreviation ?? college.name).charAt(0)}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: "0 0 5px", fontSize: 14, fontWeight: 700, color: T.fg, lineHeight: 1.3 }}>
            {college.name}{abbrev}
          </h3>
          <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}14`, borderRadius: 99, padding: "2px 8px" }}>
            {label}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.muted }}>
        <MapPin size={13} /><span>{college.province}</span>
      </div>

      <div style={{ marginTop: "auto" }}>
        {college.website ? (
          <a
            href={college.website} target="_blank" rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              width: "100%", padding: "9px 0", borderRadius: 8,
              background: color, color: "#fff",
              fontWeight: 600, fontSize: 13, textDecoration: "none",
            }}
          >
            Visit Website <ExternalLink size={13} />
          </a>
        ) : (
          <div style={{ fontSize: 12, color: T.muted, textAlign: "center", padding: "6px 0" }}>No website available</div>
        )}
      </div>
    </div>
  );
}
