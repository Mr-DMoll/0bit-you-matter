"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/client";

const T = {
  primary:  "#5B4FCF",
  secondary:"#EEE9FF",
  teal:     "#0D9488",
  bg:       "#FAFAF9",
  card:     "#FFFFFF",
  fg:       "#1A1535",
  muted:    "#7A7499",
  border:   "rgba(91,79,207,0.12)",
};

const RIASEC_COLOR: Record<string, string> = {
  R: "#ef4444", I: "#3b82f6", A: "#f59e0b",
  S: "#22c55e", E: "#8b5cf6", C: "#f97316",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: T.card, borderRadius: 16, padding: "20px 24px", border: `1px solid ${T.border}` }}>
      <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: T.muted }}>{title}</p>
      {children}
    </div>
  );
}

export function CareerDetailPage({ slug }: { slug: string }) {
  const router = useRouter();

  const [career,  setCareer]  = useState<any>(null);
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [careerRes, profileRes] = await Promise.all([
          apiClient.get(`/careers/${slug}`),
          apiClient.get("/learner/profile").catch(() => ({ data: { data: null } })),
        ]);
        const c = careerRes.data.data;
        setCareer(c);
        const savedCareers = profileRes.data.data?.savedCareers ?? [];
        setSaved(savedCareers.some((s: any) => s.careerId === c.id || s.career?.id === c.id));
      } catch {
        setError("Could not load this career. It may not exist yet.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const handleSave = async () => {
    if (!career) return;
    setSaving(true);
    try {
      if (saved) {
        await apiClient.delete(`/learner/saved-careers/${career.id}`);
        setSaved(false);
      } else {
        await apiClient.post("/learner/saved-careers", { careerId: career.id });
        setSaved(true);
      }
    } catch {}
    setSaving(false);
  };

  if (loading) return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 14 }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${T.primary}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginRight: 12 }} />
      Loading career…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !career) return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: T.muted, fontFamily: "inherit" }}>
      <p style={{ fontSize: 32 }}>😕</p>
      <p style={{ fontSize: 14, color: T.fg, fontWeight: 600 }}>{error || "Career not found"}</p>
      <button onClick={() => router.push("/learner/matches")} style={{ padding: "9px 20px", borderRadius: 10, background: T.primary, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
        ← Back to matches
      </button>
    </div>
  );

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "inherit" }}>

      {/* Sticky top bar */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button
          onClick={() => router.back()}
          style={{ background: "none", border: "none", color: T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          ← Back
        </button>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: T.fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {career.title}
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10,
            border: `1.5px solid ${saved ? T.teal : T.border}`,
            background: saved ? T.teal + "12" : "transparent",
            color: saved ? T.teal : T.muted,
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          {saved ? "♥ Saved" : "♡ Save"}
        </button>
      </div>

      <div style={{ padding: "28px 24px 60px" }}>

        {/* Hero */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, color: T.fg }}>{career.title}</h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {career.cluster?.name && (
              <span style={{ fontSize: 12, color: T.muted, background: T.secondary, padding: "3px 10px", borderRadius: 99, fontWeight: 600 }}>
                {career.cluster.name}
              </span>
            )}
            {(career.riasecCodes ?? []).map((c: string) => (
              <span key={c} style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: (RIASEC_COLOR[c] ?? T.primary) + "18", color: RIASEC_COLOR[c] ?? T.primary }}>
                {c}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Earnings */}
          {(career.earningsMin || career.earningsMax) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Starting salary", value: career.earningsMin ? `R${Number(career.earningsMin).toLocaleString("en-ZA")} /yr` : "—" },
                { label: "Experienced salary", value: career.earningsMax ? `R${Number(career.earningsMax).toLocaleString("en-ZA")} /yr` : "—" },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: T.card, borderRadius: 12, padding: "14px 18px", border: `1px solid ${T.border}` }}>
                  <p style={{ margin: "0 0 2px", fontSize: 11, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.teal }}>{value}</p>
                  {career.earningsNote && <p style={{ margin: "2px 0 0", fontSize: 11, color: T.muted }}>{career.earningsNote}</p>}
                </div>
              ))}
            </div>
          )}

          {career.overview     && <Section title="Overview"><p style={{ margin: 0, fontSize: 14, color: T.fg, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{career.overview}</p></Section>}
          {career.dayInTheLife && <Section title="A day in the life"><p style={{ margin: 0, fontSize: 14, color: T.fg, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{career.dayInTheLife}</p></Section>}
          {career.howToGetThere&& <Section title="How to get there"><p style={{ margin: 0, fontSize: 14, color: T.fg, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{career.howToGetThere}</p></Section>}
          {career.saContext    && <Section title="In South Africa"><p style={{ margin: 0, fontSize: 14, color: T.fg, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{career.saContext}</p></Section>}

          {career.nqfLevelMin && (
            <Section title="Minimum requirements">
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: T.secondary, borderRadius: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.primary }}>NQF Level {career.nqfLevelMin}+</span>
                <span style={{ fontSize: 12, color: T.muted }}>minimum qualification level</span>
              </div>
            </Section>
          )}

          {/* CTA */}
          <div style={{ background: T.primary + "08", borderRadius: 16, padding: "20px 24px", border: `1px solid ${T.primary}20` }}>
            <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: T.fg }}>Interested in this career?</p>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: T.muted }}>Save it to your profile and explore pathways to get there.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={handleSave} style={{ padding: "10px 20px", borderRadius: 10, background: saved ? T.teal : T.primary, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {saved ? "♥ Saved" : "♡ Save to profile"}
              </button>
              <button onClick={() => router.push("/learner/matches")} style={{ padding: "10px 20px", borderRadius: 10, background: "none", border: `1.5px solid ${T.border}`, color: T.muted, fontSize: 13, cursor: "pointer" }}>
                ← All matches
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
