"use client";

import { useState } from "react";
import { Clock, ExternalLink } from "lucide-react";

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

const BURSARIES = [
  {
    id: 1,
    provider: "Investec",
    name: "Investec STEM Bursary",
    field: "Technology",
    amount: "R80,000",
    deadline: "31 Jul 2026",
    urgent: true,
    eligibility: "Mathematics 70%+, Grade 11/12",
  },
  {
    id: 2,
    provider: "Standard Bank",
    name: "Standard Bank Commerce Bursary",
    field: "Business",
    amount: "R60,000",
    deadline: "15 Aug 2026",
    urgent: false,
    eligibility: "Accounting 65%+, Grade 12",
  },
  {
    id: 3,
    provider: "Sasol",
    name: "Sasol Engineering Excellence Bursary",
    field: "Engineering",
    amount: "R120,000",
    deadline: "30 Jun 2026",
    urgent: true,
    eligibility: "Maths & Science 75%+",
  },
  {
    id: 4,
    provider: "ABSA",
    name: "ABSA Technology Bursary",
    field: "Technology",
    amount: "R75,000",
    deadline: "1 Sep 2026",
    urgent: false,
    eligibility: "Mathematics 70%+, South African citizen",
  },
  {
    id: 5,
    provider: "Nedbank",
    name: "Nedbank Financial Studies Bursary",
    field: "Business",
    amount: "R55,000",
    deadline: "20 Aug 2026",
    urgent: false,
    eligibility: "Accounting 60%+, Grade 12",
  },
  {
    id: 6,
    provider: "MTN",
    name: "MTN Digital Innovation Bursary",
    field: "Technology",
    amount: "R65,000",
    deadline: "15 Jul 2026",
    urgent: true,
    eligibility: "Mathematics & Science 70%+",
  },
];

const FIELDS = ["All", "Technology", "Business", "Engineering"];

const fieldColors: Record<string, { bg: string; color: string }> = {
  Technology:  { bg: T.secondary, color: T.primary },
  Business:    { bg: "#FEF3C7", color: "#D97706" },
  Engineering: { bg: "#D1FAE5", color: T.teal },
};

export function BursariesPage() {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [valueFilter, setValueFilter] = useState("all");

  const toggleField = (f: string) => {
    setSelectedFields((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const filtered = BURSARIES.filter((b) => {
    const fieldOk = selectedFields.length === 0 || selectedFields.includes(b.field);
    const amount = parseInt(b.amount.replace(/\D/g, ""));
    const valueOk =
      valueFilter === "all" ||
      (valueFilter === "under60" && amount < 60000) ||
      (valueFilter === "60to80" && amount >= 60000 && amount <= 80000) ||
      (valueFilter === "over80" && amount > 80000);
    return fieldOk && valueOk;
  });

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px 48px", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: T.fg }}>Funding For You</h1>
          <p style={{ margin: 0, fontSize: 14, color: T.muted }}>Bursaries matched to your profile and interests.</p>
        </div>
        <div style={{ marginLeft: "auto", background: T.primary, color: "#fff", borderRadius: 99, padding: "4px 14px", fontSize: 13, fontWeight: 600 }}>
          {filtered.length} matches
        </div>
      </div>

      <div className="bursaries-layout" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>
        {/* Sidebar filters */}
        <div style={{ background: T.card, borderRadius: 14, padding: 18, border: `1px solid ${T.border}`, alignSelf: "start" }}>
          <h4 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: T.fg }}>Filter</h4>

          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Field</p>
          {FIELDS.filter((f) => f !== "All").map((f) => (
            <label key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={selectedFields.includes(f)}
                onChange={() => toggleField(f)}
                style={{ accentColor: T.primary }}
              />
              <span style={{ fontSize: 13, color: T.fg }}>{f}</span>
            </label>
          ))}

          <div style={{ height: 1, background: T.border, margin: "14px 0" }} />

          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Value</p>
          {[
            { value: "all", label: "Any amount" },
            { value: "under60", label: "Under R60k" },
            { value: "60to80", label: "R60k – R80k" },
            { value: "over80", label: "Over R80k" },
          ].map((o) => (
            <label key={o.value} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer" }}>
              <input
                type="radio"
                name="value"
                checked={valueFilter === o.value}
                onChange={() => setValueFilter(o.value)}
                style={{ accentColor: T.primary }}
              />
              <span style={{ fontSize: 13, color: T.fg }}>{o.label}</span>
            </label>
          ))}
        </div>

        {/* Cards grid */}
        <div className="bursary-cards" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {filtered.map((b) => {
            const fc = fieldColors[b.field] ?? { bg: T.secondary, color: T.primary };
            return (
              <div key={b.id} style={{ background: T.card, borderRadius: 14, padding: 18, border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.fg }}>{b.provider}</span>
                  {b.urgent && (
                    <span style={{ fontSize: 11, fontWeight: 600, background: "#FEE2E2", color: T.coral, borderRadius: 99, padding: "2px 8px" }}>Urgent</span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.fg }}>{b.name}</p>
                <span style={{ fontSize: 11, fontWeight: 600, background: fc.bg, color: fc.color, borderRadius: 99, padding: "3px 10px", alignSelf: "flex-start" }}>{b.field}</span>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.coral }}>{b.amount}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.muted }}>
                  <Clock size={13} />
                  <span>Deadline: {b.deadline}</span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: T.muted }}>{b.eligibility}</p>
                <button style={{ marginTop: "auto", background: T.primary, color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  Apply Now <ExternalLink size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .bursaries-layout { grid-template-columns: 1fr !important; }
          .bursary-cards { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
