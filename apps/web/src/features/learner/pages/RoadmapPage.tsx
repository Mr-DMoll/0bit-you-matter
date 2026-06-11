"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/client";

const T = {
  primary:   "#5B4FCF",
  secondary: "#EEE9FF",
  teal:      "#0D9488",
  amber:     "#D97706",
  bg:        "#FAFAF9",
  card:      "#FFFFFF",
  fg:        "#1A1535",
  muted:     "#7A7499",
  border:    "rgba(91,79,207,0.12)",
};

const PATHWAY_META: Record<string, { icon: string; label: string; color: string; desc: string }> = {
  UNIVERSITY:   { icon: "🎓", label: "University degree",  color: T.primary, desc: "3–4 year undergraduate programme at a South African university" },
  TVET:         { icon: "🔧", label: "TVET college",       color: "#0891B2", desc: "NCV or NATED programme at a TVET college" },
  LEARNERSHIP:  { icon: "📋", label: "Learnership / SETA", color: T.amber,   desc: "Structured work-based learning programme — earn while you learn" },
  DIRECT:       { icon: "⚡", label: "Direct / RPL",       color: T.teal,    desc: "Enter the field directly or through Recognition of Prior Learning" },
};

function StepCard({ step, index, total }: { step: any; index: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 14 }}>
      {/* Line + circle */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: T.primary, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800, flexShrink: 0,
        }}>
          {index + 1}
        </div>
        {index < total - 1 && (
          <div style={{ width: 2, flex: 1, background: T.border, margin: "4px 0", minHeight: 24 }} />
        )}
      </div>
      {/* Content */}
      <div style={{ paddingBottom: index < total - 1 ? 20 : 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.fg }}>{step.title}</p>
          {step.duration && (
            <span style={{ fontSize: 11, color: T.muted, background: T.secondary, borderRadius: 99, padding: "2px 8px" }}>
              {step.duration}
            </span>
          )}
        </div>
        {step.description && (
          <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{step.description}</p>
        )}
      </div>
    </div>
  );
}

// Returns true if the pathway text mentions Mathematics (not just Maths Literacy)
function pathwayRequiresMaths(pathway: any): boolean {
  const text = [pathway.entryRequirements, pathway.title, pathway.subjectRequirements]
    .filter(Boolean).join(" ");
  // Remove "Mathematical Literacy" first, then check for "Mathematics" / "Maths"
  const cleaned = text.replace(/mathematical\s+literacy/gi, "");
  return /\bmathematics\b/i.test(cleaned) || /\bmaths\b/i.test(cleaned);
}

function MathsBanner({ learnerSubjects }: { learnerSubjects: string[] }) {
  const hasMaths    = learnerSubjects.includes("Mathematics");
  const hasMathsLit = learnerSubjects.includes("Mathematical Literacy");
  const hasNeither  = !hasMaths && !hasMathsLit;

  if (hasMaths) return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "#DCFCE7", border: "1px solid #86EFAC" }}>
      <span style={{ fontSize: 15 }}>✅</span>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#166534" }}>
        You're taking Mathematics — this pathway is open to you.
      </p>
    </div>
  );

  if (hasMathsLit) return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 12px", borderRadius: 8, background: "#FEF3C7", border: "1px solid #FCD34D" }}>
      <span style={{ fontSize: 15, flexShrink: 0 }}>⚠️</span>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#92400E" }}>
        This pathway requires <strong>Mathematics</strong> — not Mathematical Literacy. Consider switching subjects if this is your career goal.
      </p>
    </div>
  );

  if (hasNeither) return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: T.secondary, border: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 15 }}>📚</span>
      <p style={{ margin: 0, fontSize: 12, color: T.muted }}>
        This pathway requires Mathematics. <a href="/learner/profile" style={{ color: T.primary, fontWeight: 700 }}>Add your subjects</a> to see if you qualify.
      </p>
    </div>
  );

  return null;
}

function PathwayCard({
  pathway, selected, onSelect, learnerSubjects,
}: {
  pathway: any; selected: boolean; onSelect: () => void; learnerSubjects: string[];
}) {
  const meta = PATHWAY_META[pathway.type] ?? { icon: "📌", label: pathway.type, color: T.primary, desc: "" };
  const steps: any[] = pathway.steps ?? [];
  const needsMaths = pathwayRequiresMaths(pathway);

  return (
    <div
      onClick={onSelect}
      style={{
        background: T.card, borderRadius: 16, overflow: "hidden",
        border: `2px solid ${selected ? meta.color : T.border}`,
        cursor: "pointer", transition: "border-color 0.15s",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "14px 18px",
        background: selected ? meta.color + "0e" : "transparent",
        display: "flex", alignItems: "flex-start", gap: 12,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>{meta.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.fg }}>{pathway.title || meta.label}</p>
            {selected && (
              <span style={{ fontSize: 11, fontWeight: 700, background: meta.color, color: "#fff", borderRadius: 99, padding: "2px 8px" }}>
                Selected
              </span>
            )}
          </div>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: T.muted }}>{meta.desc}</p>
        </div>
        {/* Duration + cost pills */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
          {pathway.durationLabel && (
            <span style={{ fontSize: 11, color: meta.color, fontWeight: 700, background: meta.color + "18", borderRadius: 99, padding: "2px 8px", whiteSpace: "nowrap" }}>
              ⏱ {pathway.durationLabel}
            </span>
          )}
          {pathway.earnWhileLearn && (
            <span style={{ fontSize: 11, color: T.teal, fontWeight: 700, background: T.teal + "18", borderRadius: 99, padding: "2px 8px" }}>
              💰 Earn while learning
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Entry requirements */}
        {pathway.entryRequirements && (
          <div style={{ background: "#FEF3C7", borderRadius: 10, padding: "10px 14px" }}>
            <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 700, color: T.amber, textTransform: "uppercase", letterSpacing: "0.05em" }}>Entry requirements</p>
            <p style={{ margin: 0, fontSize: 13, color: "#92400E", lineHeight: 1.55 }}>{pathway.entryRequirements}</p>
          </div>
        )}

        {/* Maths subject alert */}
        {needsMaths && <MathsBanner learnerSubjects={learnerSubjects} />}

        {/* Steps */}
        {steps.length > 0 && (
          <div>
            <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Your journey — {steps.length} steps
            </p>
            {steps.map((step: any, i: number) => (
              <StepCard key={i} step={step} index={i} total={steps.length} />
            ))}
          </div>
        )}

        {/* Funding */}
        {(pathway.fundingOptions ?? []).length > 0 && (
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Funding options</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(pathway.fundingOptions as string[]).map((f) => (
                <span key={f} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 99, background: T.teal + "14", color: T.teal, fontWeight: 600 }}>
                  ✓ {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Cost */}
        {(pathway.estimatedCostMin || pathway.estimatedCostMax) && (
          <div style={{ display: "flex", gap: 12 }}>
            {pathway.estimatedCostMin && (
              <div style={{ flex: 1, background: T.secondary, borderRadius: 10, padding: "10px 14px" }}>
                <p style={{ margin: 0, fontSize: 11, color: T.muted, fontWeight: 600 }}>FROM</p>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.primary }}>
                  R{Number(pathway.estimatedCostMin).toLocaleString("en-ZA")}/yr
                </p>
              </div>
            )}
            {pathway.estimatedCostMax && (
              <div style={{ flex: 1, background: T.secondary, borderRadius: 10, padding: "10px 14px" }}>
                <p style={{ margin: 0, fontSize: 11, color: T.muted, fontWeight: 600 }}>UP TO</p>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.primary }}>
                  R{Number(pathway.estimatedCostMax).toLocaleString("en-ZA")}/yr
                </p>
              </div>
            )}
          </div>
        )}
        {pathway.costNote && (
          <p style={{ margin: "-8px 0 0", fontSize: 12, color: T.muted, fontStyle: "italic" }}>{pathway.costNote}</p>
        )}

        {/* SETA */}
        {pathway.setaName && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: T.muted }}>SETA:</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.fg }}>{pathway.setaName}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function RoadmapPage() {
  const router = useRouter();

  const [profile,   setProfile]   = useState<any>(null);
  const [pathways,  setPathways]  = useState<any[]>([]);
  const [activeCareerId,  setActiveCareerId]  = useState<string>("");
  const [activeCareer,    setActiveCareer]    = useState<any>(null);
  const [selectedPathwayId, setSelectedPathwayId] = useState<string>("");
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [pathwayLoading, setPathwayLoading] = useState(false);
  const [error,     setError]     = useState("");

  // Load profile (includes top career matches). Auto-trigger matching if needed.
  useEffect(() => {
    const load = async () => {
      try {
        // Always recalculate matches on load so scores reflect the latest algorithm
        let p: any = null;
        try {
          const matchRes = await apiClient.post("/learner/profile/match");
          p = matchRes.data.data;
        } catch {
          // Matching failed (e.g. no completed INTEREST session) — fall back to cached profile
          const profileRes = await apiClient.get("/learner/profile");
          p = profileRes.data.data;
        }

        setProfile(p);
        if (p?.chosenCareerId) {
          setActiveCareerId(p.chosenCareerId);
        } else if (p?.careerMatches?.length) {
          setActiveCareerId(p.careerMatches[0].career.id);
        }
      } catch {
        setError("Could not load your profile.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load pathways when career changes
  useEffect(() => {
    if (!activeCareerId) return;
    setPathwayLoading(true);
    setPathways([]);
    setSelectedPathwayId("");

    const match = profile?.careerMatches?.find((m: any) => m.career.id === activeCareerId);
    setActiveCareer(match?.career ?? null);

    apiClient.get(`/pathways/career/${activeCareerId}`)
      .then((r) => {
        const raw: any[] = r.data.data?.pathways ?? r.data.data ?? [];
        // Deduplicate: keep only the first (best) pathway per type
        const seen = new Set<string>();
        const pw = raw.filter((p) => {
          if (seen.has(p.type)) return false;
          seen.add(p.type);
          return true;
        });
        setPathways(pw);
        // Auto-select university pathway, or first available
        const uni = pw.find((p) => p.type === "UNIVERSITY");
        if (uni) setSelectedPathwayId(uni.id);
        else if (pw.length) setSelectedPathwayId(pw[0].id);
      })
      .catch(() => {})
      .finally(() => setPathwayLoading(false));
  }, [activeCareerId, profile]);

  const handleSetGoal = async () => {
    if (!activeCareerId) return;
    setSaving(true);
    try {
      await apiClient.patch("/learner/profile", {
        chosenCareerId: activeCareerId,
        chosenPathwayType: pathways.find((p) => p.id === selectedPathwayId)?.type ?? undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  if (loading) return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 14 }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${T.primary}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginRight: 12 }} />
      Loading your roadmap…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: T.muted }}>
      <p style={{ fontSize: 32 }}>😕</p>
      <p style={{ fontSize: 14, color: T.fg, fontWeight: 600 }}>{error}</p>
      <button onClick={() => router.push("/learner/assessments")} style={{ padding: "9px 20px", borderRadius: 10, background: T.primary, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
        Take assessments →
      </button>
    </div>
  );

  const matches = profile?.careerMatches ?? [];
  const hasMatches = matches.length > 0;
  const selectedPathway = pathways.find((p) => p.id === selectedPathwayId);
  const isGoalSet = profile?.chosenCareerId === activeCareerId;

  // Flatten learner subjects to a plain string array for easy matching
  const learnerSubjects: string[] = (Array.isArray(profile?.subjects) ? profile.subjects : [])
    .map((s: any) => (typeof s === "string" ? s : s?.subject ?? ""))
    .filter(Boolean);

  // No profile / no matches yet
  if (!hasMatches) return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px 60px", fontFamily: "inherit" }}>
      <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: T.fg }}>My Roadmap</h1>
      <p style={{ margin: "0 0 32px", fontSize: 14, color: T.muted }}>Your personalised plan to reach your career goal</p>

      <div style={{ background: T.card, borderRadius: 16, padding: "32px 28px", border: `1px solid ${T.border}`, textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
        <p style={{ fontSize: 40, margin: "0 0 12px" }}>🗺️</p>
        <p style={{ fontSize: 16, fontWeight: 700, color: T.fg, margin: "0 0 8px" }}>Complete your assessments first</p>
        <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, margin: "0 0 20px" }}>
          Your roadmap is built from your career matches. Take all 4 assessments to unlock your personalised career plan.
        </p>
        <button onClick={() => router.push("/learner/assessments")} style={{ padding: "10px 24px", borderRadius: 10, background: T.primary, color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Take assessments →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px 60px", fontFamily: "inherit" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: T.fg }}>My Roadmap</h1>
        <p style={{ margin: 0, fontSize: 14, color: T.muted }}>Choose a career goal and explore how to get there</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, alignItems: "start" }} className="roadmap-grid">

        {/* LEFT — Career selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Goal set banner */}
          {isGoalSet && (
            <div style={{ background: T.teal + "12", border: `1px solid ${T.teal}30`, borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🎯</span>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.teal }}>Active goal</p>
                <p style={{ margin: 0, fontSize: 11, color: T.muted }}>This is your current career target</p>
              </div>
            </div>
          )}

          {/* Career match cards */}
          <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Your top career matches
              </p>
            </div>
            {matches.map((m: any, i: number) => {
              const isActive = m.career.id === activeCareerId;
              return (
                <button
                  key={m.career.id}
                  onClick={() => setActiveCareerId(m.career.id)}
                  style={{
                    width: "100%", textAlign: "left", display: "flex", alignItems: "center",
                    gap: 10, padding: "12px 16px",
                    background: isActive ? T.primary + "0c" : "transparent",
                    border: "none", borderBottom: i < matches.length - 1 ? `1px solid ${T.border}` : "none",
                    cursor: "pointer", transition: "background 0.12s",
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: isActive ? T.primary : T.secondary,
                    color: isActive ? "#fff" : T.muted,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? T.fg : T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.career.title}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: T.muted }}>
                      {m.career.cluster?.name}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? T.primary : T.muted, flexShrink: 0 }}>
                    {Math.round(m.matchPercentage)}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={handleSetGoal}
              disabled={saving || !activeCareerId}
              style={{
                padding: "10px 0", borderRadius: 10, border: "none",
                background: saved ? T.teal : T.primary,
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                transition: "background 0.2s", opacity: saving ? 0.7 : 1,
              }}
            >
              {saved ? "✓ Goal saved!" : saving ? "Saving…" : "🎯 Set as my goal"}
            </button>
            <button
              onClick={() => router.push("/learner/matches")}
              style={{ padding: "9px 0", borderRadius: 10, border: `1.5px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 13, cursor: "pointer" }}
            >
              View all matches →
            </button>
          </div>
        </div>

        {/* RIGHT — Pathways */}
        <div>
          {/* Career title bar */}
          {activeCareer && (
            <div style={{ background: T.card, borderRadius: 16, padding: "16px 20px", border: `1px solid ${T.border}`, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Pathways to become a
                </p>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.fg }}>{activeCareer.title}</h2>
              </div>
              <button
                onClick={() => router.push(`/learner/careers/${activeCareer.slug}`)}
                style={{ padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                View career →
              </button>
            </div>
          )}

          {/* Pathway type tabs */}
          {pathways.length > 1 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {pathways.map((pw) => {
                const meta = PATHWAY_META[pw.type] ?? { icon: "📌", label: pw.type, color: T.primary };
                const isSelected = pw.id === selectedPathwayId;
                return (
                  <button
                    key={pw.id}
                    onClick={() => setSelectedPathwayId(pw.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "7px 14px", borderRadius: 99,
                      border: `1.5px solid ${isSelected ? meta.color : T.border}`,
                      background: isSelected ? meta.color + "12" : T.card,
                      color: isSelected ? meta.color : T.muted,
                      fontSize: 12, fontWeight: isSelected ? 700 : 500, cursor: "pointer",
                      transition: "all 0.12s",
                    }}
                  >
                    {meta.icon} {meta.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Pathway loading */}
          {pathwayLoading && (
            <div style={{ background: T.card, borderRadius: 16, padding: 32, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 13, gap: 10 }}>
              <div style={{ width: 20, height: 20, border: `2px solid ${T.primary}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              Loading pathways…
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* No pathways yet */}
          {!pathwayLoading && pathways.length === 0 && (
            <div style={{ background: T.card, borderRadius: 16, padding: "32px 28px", border: `1px solid ${T.border}`, textAlign: "center" }}>
              <p style={{ fontSize: 36, margin: "0 0 12px" }}>🛤️</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: T.fg, margin: "0 0 8px" }}>No pathways generated yet</p>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, margin: "0 0 20px", maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
                Pathways for this career haven't been generated yet. An admin can generate them via the AI Pipeline — Career Pathway option.
              </p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", background: T.secondary, borderRadius: 10, fontSize: 12, color: T.muted }}>
                <span>📋</span>
                AI Pipeline → Generate → Career Pathway → select this career
              </div>
            </div>
          )}

          {/* Selected pathway detail */}
          {!pathwayLoading && selectedPathway && (
            <PathwayCard
              pathway={selectedPathway}
              selected={true}
              onSelect={() => {}}
              learnerSubjects={learnerSubjects}
            />
          )}

          {/* Other pathways (collapsed) */}
          {!pathwayLoading && pathways.length > 1 && (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Other routes
              </p>
              {pathways.filter((pw) => pw.id !== selectedPathwayId).map((pw) => {
                const meta = PATHWAY_META[pw.type] ?? { icon: "📌", label: pw.type, color: T.primary };
                return (
                  <button
                    key={pw.id}
                    onClick={() => setSelectedPathwayId(pw.id)}
                    style={{
                      width: "100%", textAlign: "left", display: "flex", alignItems: "center",
                      gap: 12, padding: "12px 16px", borderRadius: 12,
                      background: T.card, border: `1px solid ${T.border}`,
                      cursor: "pointer", transition: "border-color 0.12s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = meta.color)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}
                  >
                    <span style={{ fontSize: 20 }}>{meta.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.fg }}>{pw.title || meta.label}</p>
                      {pw.durationLabel && <p style={{ margin: 0, fontSize: 12, color: T.muted }}>⏱ {pw.durationLabel}</p>}
                    </div>
                    <span style={{ fontSize: 12, color: meta.color, fontWeight: 700 }}>View →</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .roadmap-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
