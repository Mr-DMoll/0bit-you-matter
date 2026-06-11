"use client";

import { useState } from "react";
import { Search, MapPin } from "lucide-react";

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

const UNIVERSITIES = [
  {
    name: "University of Cape Town (UCT)",
    location: "Cape Town, Western Cape",
    aps: "36–42",
    programmes: ["BSc Computer Science", "Medicine", "Engineering", "Commerce"],
  },
  {
    name: "University of the Witwatersrand (Wits)",
    location: "Johannesburg, Gauteng",
    aps: "35–42",
    programmes: ["BSc Engineering", "Law", "Health Sciences", "Commerce"],
  },
  {
    name: "University of Pretoria (UP)",
    location: "Pretoria, Gauteng",
    aps: "32–40",
    programmes: ["IT & Computer Science", "Veterinary Science", "Engineering", "Education"],
  },
  {
    name: "Stellenbosch University",
    location: "Stellenbosch, Western Cape",
    aps: "34–42",
    programmes: ["AgriSciences", "Engineering", "Medicine", "Business Science"],
  },
  {
    name: "University of Johannesburg (UJ)",
    location: "Johannesburg, Gauteng",
    aps: "28–36",
    programmes: ["BSc IT", "Engineering", "Business", "Design"],
  },
  {
    name: "University of KwaZulu-Natal (UKZN)",
    location: "Durban, KwaZulu-Natal",
    aps: "28–36",
    programmes: ["Medicine", "Engineering", "Law", "Education"],
  },
];

const TVET_COLLEGES = [
  {
    name: "Ekurhuleni West TVET College",
    location: "Ekurhuleni, Gauteng",
    aps: "N/A",
    programmes: ["N4–N6 IT", "Engineering Studies", "Business Studies", "Electrical"],
  },
  {
    name: "False Bay TVET College",
    location: "Cape Town, Western Cape",
    aps: "N/A",
    programmes: ["IT & Computer Science", "Engineering", "Tourism", "Finance"],
  },
  {
    name: "Tshwane South TVET College",
    location: "Pretoria, Gauteng",
    aps: "N/A",
    programmes: ["Information Technology", "Electrical Engineering", "Civil Engineering"],
  },
];

const PRIVATE_COLLEGES = [
  {
    name: "IIE Rosebank College",
    location: "Johannesburg, Gauteng",
    aps: "26–32",
    programmes: ["BCom", "IT", "Media", "Law"],
  },
  {
    name: "Boston City Campus",
    location: "Nationwide",
    aps: "20–28",
    programmes: ["Business Management", "IT", "Marketing", "Human Resources"],
  },
  {
    name: "Richfield Graduate Institute",
    location: "Durban, KwaZulu-Natal",
    aps: "20–28",
    programmes: ["BCom Accounting", "IT", "Business Administration"],
  },
];

const TABS = ["Universities", "TVET Colleges", "Private Colleges"];

export function UniversitiesPage() {
  const [tab, setTab] = useState("Universities");
  const [search, setSearch] = useState("");

  const dataMap: Record<string, typeof UNIVERSITIES> = {
    "Universities": UNIVERSITIES,
    "TVET Colleges": TVET_COLLEGES,
    "Private Colleges": PRIVATE_COLLEGES,
  };

  const data = (dataMap[tab] ?? []).filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px 48px", fontFamily: "inherit" }}>
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
              width: "100%",
              padding: "10px 12px 10px 36px",
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              fontSize: 14,
              color: T.fg,
              background: T.card,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Note banner */}
      <div style={{ background: T.secondary, borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: T.primary }}>
        ℹ️ Showing minimum APS and key programmes to help you plan your path.
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: T.card, borderRadius: 10, padding: 4, border: `1px solid ${T.border}`, alignSelf: "flex-start", width: "fit-content" }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: tab === t ? T.primary : "none",
              color: tab === t ? "#fff" : T.muted,
              border: "none",
              borderRadius: 8,
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* University cards grid */}
      <div className="uni-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        {data.map((u, i) => (
          <div key={i} style={{ background: T.card, borderRadius: 14, padding: 20, border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.fg, lineHeight: 1.3 }}>{u.name}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.muted }}>
              <MapPin size={13} />
              <span>{u.location}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>APS:</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.primary, background: T.secondary, borderRadius: 99, padding: "2px 10px" }}>{u.aps}</span>
            </div>
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Top Programmes</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {u.programmes.map((p) => (
                  <span key={p} style={{ fontSize: 11, background: T.secondary, color: T.primary, borderRadius: 6, padding: "3px 8px" }}>{p}</span>
                ))}
              </div>
            </div>
            <button style={{ marginTop: "auto", background: "none", color: T.primary, border: `1.5px solid ${T.primary}`, borderRadius: 8, padding: "8px 0", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              View Details
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .uni-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .uni-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
