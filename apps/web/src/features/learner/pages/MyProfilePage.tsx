"use client";

import { Edit2, LogOut } from "lucide-react";

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

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: T.card, borderRadius: 16, padding: 20, border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.fg }}>{title}</h3>
        <button style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: T.primary, fontSize: 13, fontWeight: 500 }}>
          <Edit2 size={14} /> Edit
        </button>
      </div>
      {children}
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 13, color: T.muted }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: T.fg }}>{value}</span>
    </div>
  );
}

export function MyProfilePage() {
  const completionPct = 40;

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px 48px", fontFamily: "inherit" }}>
      {/* Profile hero */}
      <div style={{ background: T.card, borderRadius: 16, padding: 24, border: `1px solid ${T.border}`, marginBottom: 20, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: T.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
          TM
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 700, color: T.fg }}>Thabo Molefe</h2>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: T.muted }}>Grade 11 · Gauteng</p>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: T.muted }}>Profile completion</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.primary }}>{completionPct}%</span>
            </div>
            <div style={{ height: 6, background: T.secondary, borderRadius: 99 }}>
              <div style={{ width: `${completionPct}%`, height: "100%", background: T.primary, borderRadius: 99 }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* About You */}
        <SectionCard title="About You">
          <ProfileRow label="Grade" value="Grade 11" />
          <ProfileRow label="Province" value="Gauteng" />
          <ProfileRow label="School" value="Greenside High" />
          <div style={{ padding: "8px 0" }}>
            <span style={{ fontSize: 13, color: T.muted }}>Interests</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {["Technology", "Sciences"].map((tag) => (
                <span key={tag} style={{ fontSize: 12, fontWeight: 600, background: T.secondary, color: T.primary, borderRadius: 99, padding: "3px 12px" }}>{tag}</span>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Career Goals */}
        <SectionCard title="Career Goals">
          <div style={{ marginBottom: 14 }}>
            <p style={{ margin: "0 0 8px", fontSize: 13, color: T.muted }}>Saved careers</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["Software Engineer", "Data Scientist"].map((c) => (
                <span key={c} style={{ fontSize: 12, fontWeight: 600, background: T.secondary, color: T.primary, borderRadius: 99, padding: "4px 12px" }}>{c}</span>
              ))}
            </div>
          </div>
          <ProfileRow label="Target University" value="University of Cape Town (UCT)" />
        </SectionCard>

        {/* Account */}
        <SectionCard title="Account">
          <ProfileRow label="Email" value="thabo.molefe@student.co.za" />
          <ProfileRow label="Joined" value="May 2026" />
          <div style={{ marginTop: 16 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 8, background: "#FEE2E2", color: T.coral, border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
