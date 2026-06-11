"use client";

import { useState } from "react";
import { Search, Bookmark } from "lucide-react";

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

const CAREERS = [
  { emoji: "💻", name: "Software Engineer",      desc: "Build software systems, apps and digital products.", field: "Technology" },
  { emoji: "🩺", name: "Medical Doctor",          desc: "Diagnose and treat patients across all age groups.", field: "Health" },
  { emoji: "📊", name: "Data Scientist",          desc: "Extract insights from complex datasets using statistics.", field: "Technology" },
  { emoji: "🏗️", name: "Civil Engineer",          desc: "Design and oversee construction of infrastructure.", field: "Trades" },
  { emoji: "⚖️", name: "Advocate",                desc: "Represent clients in high courts and legal proceedings.", field: "Law" },
  { emoji: "📚", name: "Teacher",                 desc: "Educate and inspire the next generation of learners.", field: "Education" },
  { emoji: "🎨", name: "Graphic Designer",        desc: "Create visual content for brands and communications.", field: "Creative" },
  { emoji: "💼", name: "Chartered Accountant",    desc: "Manage financial reporting, auditing and tax compliance.", field: "Business" },
  { emoji: "💊", name: "Pharmacist",              desc: "Dispense medication and advise on drug therapies.", field: "Health" },
  { emoji: "✏️", name: "UX Designer",             desc: "Design intuitive digital experiences for users.", field: "Creative" },
  { emoji: "🚀", name: "Entrepreneur",            desc: "Build and scale innovative businesses from the ground up.", field: "Business" },
  { emoji: "⚡", name: "Electrician",             desc: "Install and maintain electrical systems and wiring.", field: "Trades" },
];

const FILTERS = ["All", "Health", "Technology", "Business", "Law", "Education", "Creative", "Trades"];

const fieldColors: Record<string, { bg: string; color: string }> = {
  Technology: { bg: T.secondary, color: T.primary },
  Health:     { bg: "#D1FAE5", color: T.teal },
  Business:   { bg: "#FEF3C7", color: "#D97706" },
  Law:        { bg: "#FCE7F3", color: "#DB2777" },
  Education:  { bg: "#DBEAFE", color: "#2563EB" },
  Creative:   { bg: "#FDE8D8", color: "#C2410C" },
  Trades:     { bg: "#F3F4F6", color: "#374151" },
};

export function ExploreCareersPage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = CAREERS.filter((c) => {
    const matchField = filter === "All" || c.field === filter;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.desc.toLowerCase().includes(search.toLowerCase());
    return matchField && matchSearch;
  });

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px 48px", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: T.fg }}>Explore Careers</h1>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: T.muted }}>Find the career path that fits your strengths and interests.</p>

        {/* Search */}
        <div style={{ position: "relative", maxWidth: 420 }}>
          <Search size={16} color={T.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search careers..."
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

      {/* Filter chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? T.primary : T.card,
              color: filter === f ? "#fff" : T.muted,
              border: `1px solid ${filter === f ? T.primary : T.border}`,
              borderRadius: 99,
              padding: "6px 16px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Career grid */}
      <div className="careers-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {filtered.map((c) => {
          const fc = fieldColors[c.field] ?? { bg: T.secondary, color: T.primary };
          return (
            <div
              key={c.name}
              style={{ background: T.card, borderRadius: 14, padding: 18, border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 8 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: 28 }}>{c.emoji}</span>
                <button style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                  <Bookmark size={16} color={T.muted} />
                </button>
              </div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.fg }}>{c.name}</h3>
              <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.5 }}>{c.desc}</p>
              <span style={{ fontSize: 11, fontWeight: 600, background: fc.bg, color: fc.color, borderRadius: 99, padding: "3px 10px", alignSelf: "flex-start" }}>
                {c.field}
              </span>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: T.muted }}>
          <p style={{ fontSize: 16 }}>No careers match your search.</p>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .careers-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
