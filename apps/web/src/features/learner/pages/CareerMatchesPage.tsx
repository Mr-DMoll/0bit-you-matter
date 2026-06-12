"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/client";
import { InfoBanner } from "@/features/learner/components/InfoBanner";

const T = {
  primary:  "#5B4FCF",
  secondary:"#EEE9FF",
  teal:     "#0D9488",
  coral:    "#F97066",
  bg:       "#FAFAF9",
  card:     "#FFFFFF",
  fg:       "#1A1535",
  muted:    "#7A7499",
  border:   "rgba(91,79,207,0.12)",
};

const RIASEC_LABEL: Record<string, string> = {
  R: "Realistic", I: "Investigative", A: "Artistic",
  S: "Social",    E: "Enterprising",  C: "Conventional",
};
const RIASEC_COLOR: Record<string, string> = {
  R: "#ef4444", I: "#3b82f6", A: "#f59e0b",
  S: "#22c55e", E: "#8b5cf6", C: "#f97316",
};

function RiasecPill({ code }: { code: string }) {
  const color = RIASEC_COLOR[code] ?? T.primary;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
      background: color + "18", color, border: `1px solid ${color}40`,
    }}>
      <span style={{ fontWeight: 800 }}>{code}</span>
      <span style={{ fontWeight: 400, opacity: 0.85 }}>{RIASEC_LABEL[code]}</span>
    </span>
  );
}

export function CareerMatchesPage() {
  const router = useRouter();

  const [profile,   setProfile]   = useState<any>(null);
  const [matches,   setMatches]   = useState<any[]>([]);
  const [saved,     setSaved]     = useState<Set<string>>(new Set());
  const [loading,   setLoading]   = useState(true);
  const [matching,  setMatching]  = useState(false);
  const [savingId,  setSavingId]  = useState<string | null>(null);
  const [error,     setError]     = useState("");

  const loadProfile = async () => {
    const res = await apiClient.get("/learner/profile");
    const p   = res.data.data;
    setProfile(p);
    const m = p?.careerMatches ?? [];
    setMatches(m);
    const savedIds = new Set<string>((p?.savedCareers ?? []).map((s: any) => s.careerId as string));
    setSaved(savedIds);
    return m;
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // Always recalculate so scores reflect the latest algorithm
        setMatching(true);
        await apiClient.post("/learner/profile/match").catch(() => {});
        setMatching(false);
        await loadProfile();
      } catch (e: any) {
        setError(e?.response?.data?.message ?? "Could not load career matches");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSave = async (careerId: string) => {
    setSavingId(careerId);
    try {
      if (saved.has(careerId)) {
        await apiClient.delete(`/learner/saved-careers/${careerId}`);
        setSaved(prev => { const s = new Set(prev); s.delete(careerId); return s; });
      } else {
        await apiClient.post("/learner/saved-careers", { careerId });
        setSaved(prev => new Set([...prev, careerId]));
      }
    } catch {}
    setSavingId(null);
  };

  const riasecType: string   = profile?.riasecType ?? "";
  const riasecScores: any    = profile?.riasecScores ?? {};
  const topCodes             = riasecType.split("").filter(Boolean);

  if (loading || matching) {
    return (
      <div style={{ background: T.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: T.muted, fontFamily: "inherit" }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${T.primary}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
          {matching ? "Calculating your career matches…" : "Loading your profile…"}
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="matches-wrap" style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px 48px", fontFamily: "inherit" }}>

      <InfoBanner
        id="career-matches"
        icon="🎯"
        title="How are these matches calculated?"
        body="Your matches are ranked by how well each career aligns with your RIASEC personality type and the subjects you're taking. The percentage shows how strong the fit is — not a guarantee, just a guide."
        tip="Save careers that interest you and they'll appear on your roadmap for easy access."
      />

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: T.fg }}>Your Career Matches</h1>
        <p style={{ margin: 0, fontSize: 14, color: T.muted }}>
          Based on your assessment results — ranked by how well each career fits your profile.
        </p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#FEE2E2", color: "#991B1B", borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* RIASEC profile card */}
      {riasecType && (
        <div style={{
          background: T.card, borderRadius: 16, padding: "20px 24px",
          border: `1px solid ${T.border}`, marginBottom: 28,
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Your RIASEC Type</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: T.primary, letterSpacing: 2 }}>{riasecType}</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {topCodes.map((c) => <RiasecPill key={c} code={c} />)}
            </div>
          </div>

          {/* RIASEC score bars */}
          {Object.keys(riasecScores).length > 0 && (
            <div style={{ overflowX: "auto", margin: "0 -4px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, minWidth: 300 }}>
              {["R","I","A","S","E","C"].map((code) => {
                const score = riasecScores[code] ?? 0;
                const max   = Math.max(...Object.values(riasecScores as Record<string,number>));
                const pct   = max > 0 ? Math.round((score / max) * 100) : 0;
                const color = RIASEC_COLOR[code];
                return (
                  <div key={code} style={{ textAlign: "center" }}>
                    <div style={{ height: 48, display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: 4 }}>
                      <div style={{ width: "60%", background: color + "20", borderRadius: 4, overflow: "hidden", height: "100%", display: "flex", alignItems: "flex-end" }}>
                        <div style={{ width: "100%", height: `${pct}%`, background: color, borderRadius: 4, transition: "height 0.5s ease" }} />
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color }}>{code}</p>
                    <p style={{ margin: 0, fontSize: 10, color: T.muted }}>{score}</p>
                  </div>
                );
              })}
            </div>
            </div>
          )}

          {profile?.profileNarrative && (
            <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.6, paddingTop: 4, borderTop: `1px solid ${T.border}` }}>
              {profile.profileNarrative}
            </p>
          )}
        </div>
      )}

      {/* Career match cards */}
      {matches.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: T.muted }}>
          <p style={{ fontSize: 32, margin: "0 0 12px" }}>🔍</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: T.fg, margin: "0 0 8px" }}>No matches found yet</p>
          <p style={{ fontSize: 13, margin: "0 0 20px" }}>We need approved careers in the database to match against. Check back soon.</p>
          <button
            onClick={() => { setMatching(true); apiClient.post("/learner/profile/match").then(() => loadProfile()).finally(() => setMatching(false)); }}
            style={{ padding: "10px 24px", borderRadius: 10, background: T.primary, color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* Desktop: single-column list */}
          <div className="matches-list" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {matches.map((m: any, i: number) => {
              const career   = m.career;
              const pct      = Math.round(m.matchPercentage);
              const isSaved  = saved.has(career.id);
              const isSaving = savingId === career.id;
              const pctColor = pct >= 80 ? T.teal : pct >= 60 ? T.primary : T.muted;

              return (
                <div
                  key={m.id ?? career.id}
                  style={{
                    background: T.card, borderRadius: 16, padding: "18px 22px",
                    border: `1px solid ${i === 0 ? T.primary + "40" : T.border}`,
                    display: "flex", alignItems: "center", gap: 18,
                    boxShadow: i === 0 ? `0 2px 12px ${T.primary}14` : "none",
                  }}
                >
                  {/* Rank */}
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                    background: i === 0 ? T.primary : T.secondary,
                    color: i === 0 ? "#fff" : T.primary,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 800,
                  }}>
                    {i + 1}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.fg }}>{career.title}</h3>
                    </div>
                    <p style={{ margin: "0 0 6px", fontSize: 11, color: T.muted, fontWeight: 500 }}>{career.cluster?.name}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {(career.riasecCodes ?? []).map((c: string) => (
                        <span key={c} style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: (RIASEC_COLOR[c] ?? T.primary) + "18", color: RIASEC_COLOR[c] ?? T.primary }}>
                          {c}
                        </span>
                      ))}
                      {career.earningsMin && (
                        <span style={{ fontSize: 11, color: T.muted }}>
                          R{Math.round(career.earningsMin / 1000)}k–R{Math.round((career.earningsMax ?? career.earningsMin) / 1000)}k /yr
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Match % */}
                  <div style={{ textAlign: "center", flexShrink: 0, minWidth: 52 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, color: pctColor }}>{pct}%</p>
                    <p style={{ margin: 0, fontSize: 10, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>match</p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => handleSave(career.id)}
                      disabled={isSaving}
                      title={isSaved ? "Unsave" : "Save career"}
                      style={{
                        width: 36, height: 36, borderRadius: "50%", border: `1.5px solid ${isSaved ? T.teal : T.border}`,
                        background: isSaved ? T.teal + "14" : "transparent",
                        color: isSaved ? T.teal : T.muted,
                        fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {isSaved ? "♥" : "♡"}
                    </button>
                    <button
                      onClick={() => router.push(`/learner/careers/${career.slug}`)}
                      style={{
                        padding: "8px 16px", borderRadius: 10,
                        background: T.primary, color: "#fff",
                        border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Explore →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile: 2-column compact grid */}
          <div className="matches-grid" style={{ display: "none", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {matches.map((m: any, i: number) => {
              const career   = m.career;
              const pct      = Math.round(m.matchPercentage);
              const isSaved  = saved.has(career.id);
              const isSaving = savingId === career.id;
              const pctColor = pct >= 80 ? T.teal : pct >= 60 ? T.primary : T.muted;

              return (
                <div
                  key={m.id ?? career.id}
                  style={{
                    background: T.card, borderRadius: 14,
                    border: `1px solid ${i === 0 ? T.primary + "40" : T.border}`,
                    boxShadow: i === 0 ? `0 2px 8px ${T.primary}12` : "none",
                    display: "flex", flexDirection: "column", overflow: "hidden",
                  }}
                >
                  {/* Top bar: rank + match % */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 12px 0",
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: i === 0 ? T.primary : T.secondary,
                      color: i === 0 ? "#fff" : T.primary,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 800, flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 800, color: pctColor }}>{pct}%</span>
                  </div>

                  {/* Career title + cluster */}
                  <div style={{ padding: "8px 12px", flex: 1 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: T.fg, lineHeight: 1.3 }}>
                      {career.title}
                    </p>
                    <p style={{ margin: "0 0 6px", fontSize: 11, color: T.muted, lineHeight: 1.3 }}>
                      {career.cluster?.name}
                    </p>
                    {career.earningsMin && (
                      <p style={{ margin: 0, fontSize: 10, color: T.muted }}>
                        R{Math.round(career.earningsMin / 1000)}k–R{Math.round((career.earningsMax ?? career.earningsMin) / 1000)}k /yr
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", borderTop: `1px solid ${T.border}` }}>
                    <button
                      onClick={() => handleSave(career.id)}
                      disabled={isSaving}
                      style={{
                        flex: "0 0 44px", padding: "10px 0",
                        background: isSaved ? T.teal + "12" : "transparent",
                        border: "none", borderRight: `1px solid ${T.border}`,
                        color: isSaved ? T.teal : T.muted,
                        fontSize: 15, cursor: "pointer",
                      }}
                    >
                      {isSaved ? "♥" : "♡"}
                    </button>
                    <button
                      onClick={() => router.push(`/learner/careers/${career.slug}`)}
                      style={{
                        flex: 1, padding: "10px 0",
                        background: "transparent", border: "none",
                        color: T.primary, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      Explore →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Recalculate button */}
      {matches.length > 0 && (
        <div style={{ marginTop: 28, textAlign: "center" }}>
          <button
            onClick={() => {
              setMatching(true);
              setLoading(true);
              apiClient.post("/learner/profile/match")
                .then(() => loadProfile())
                .finally(() => { setMatching(false); setLoading(false); });
            }}
            style={{ padding: "9px 20px", borderRadius: 10, background: "none", border: `1.5px solid ${T.border}`, color: T.muted, fontSize: 13, cursor: "pointer" }}
          >
            ↺ Recalculate matches
          </button>
        </div>
      )}
    <style>{`
      @media (max-width: 768px) {
        .matches-wrap { padding: 16px 16px 80px !important; }
        .matches-list { display: none !important; }
        .matches-grid { display: grid !important; }
      }
    `}</style>
    </div>
  );
}
