"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "@/api/client";

const T = {
  primary:   "#5B4FCF",
  secondary: "#EEE9FF",
  teal:      "#0D9488",
  amber:     "#D97706",
  coral:     "#F97066",
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

// ── Grade 9 stream guidance ───────────────────────────────────────────────────

const STREAM_MAP: Record<string, { stream: string; subjects: string; color: string; icon: string }> = {
  R: { stream: "Science & Technology",  subjects: "Mathematics, Physical Sciences, Life Sciences",            color: "#2563EB", icon: "🔬" },
  I: { stream: "Science & Technology",  subjects: "Mathematics, Physical Sciences, Information Technology",   color: "#2563EB", icon: "🔬" },
  A: { stream: "Arts & Humanities",     subjects: "History, Visual Arts, Dramatic Arts, Music",               color: "#7C3AED", icon: "🎨" },
  S: { stream: "Social Sciences",       subjects: "History, Geography, Life Sciences, Languages",             color: "#0D9488", icon: "🤝" },
  E: { stream: "Commerce & Business",   subjects: "Accounting, Business Studies, Economics, Mathematics",     color: "#D97706", icon: "💼" },
  C: { stream: "Commerce & Business",   subjects: "Accounting, Business Studies, Economics, Mathematics",     color: "#D97706", icon: "💼" },
};

function Grade9StreamGuide({ riasecType }: { riasecType: string }) {
  const topCode = riasecType?.[0] ?? "";
  const stream  = STREAM_MAP[topCode];
  if (!stream) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: T.card, borderRadius: 16, padding: "20px 24px", border: `1px solid ${T.border}` }}>
        <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Your recommended stream</p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <span style={{ fontSize: 32 }}>{stream.icon}</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.fg }}>{stream.stream}</h2>
            <p style={{ margin: 0, fontSize: 13, color: T.muted }}>Based on your RIASEC type: {riasecType}</p>
          </div>
        </div>
        <div style={{ background: T.secondary, borderRadius: 10, padding: "10px 14px" }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: T.primary }}>Subjects to consider in Grade 10</p>
          <p style={{ margin: 0, fontSize: 13, color: T.fg }}>{stream.subjects}</p>
        </div>
      </div>

      <div style={{ background: T.card, borderRadius: 16, padding: "20px 24px", border: `1px solid ${T.border}` }}>
        <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: T.fg }}>What to do now — Grade 9</p>
        {[
          { step: "1", text: "Look at your career matches above to see what careers interest you" },
          { step: "2", text: "Research the stream subjects — talk to teachers about what each subject involves" },
          { step: "3", text: "Choose subjects in Grade 10 that match your career direction" },
          { step: "4", text: "Once you're in Grade 10, come back and add your subjects for a detailed roadmap" },
        ].map(({ step, text }) => (
          <div key={step} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
              {step}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.6, paddingTop: 3 }}>{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── APS Calculator ────────────────────────────────────────────────────────────

function markToLevel(mark: number): number {
  if (mark >= 80) return 7;
  if (mark >= 70) return 6;
  if (mark >= 60) return 5;
  if (mark >= 50) return 4;
  if (mark >= 40) return 3;
  if (mark >= 30) return 2;
  return 1;
}

function calcAPS(subjects: Array<{ subject: string; mark?: number | null }>): number | null {
  const withMarks = subjects.filter((s) => s.mark != null);
  if (withMarks.length < 6) return null;

  const scored = withMarks.map((s) => ({
    subject: s.subject,
    level:   markToLevel(s.mark!),
    isLO:    s.subject.toLowerCase().includes("life orientation"),
  }));

  // Cap Life Orientation at 4, take best 6
  const capped = scored.map((s) => ({ ...s, level: s.isLO ? Math.min(s.level, 4) : s.level }));
  const top6   = capped.sort((a, b) => b.level - a.level).slice(0, 6);
  return top6.reduce((sum, s) => sum + s.level, 0);
}

function APSBanner({ learnerSubjects, careerApsMin }: {
  learnerSubjects: Array<{ subject: string; mark?: number | null }>;
  careerApsMin: number | null;
}) {
  const aps = calcAPS(learnerSubjects);
  if (!careerApsMin && aps === null) return null;

  const gap = aps !== null && careerApsMin ? careerApsMin - aps : null;
  const onTrack = gap !== null && gap <= 0;

  return (
    <div style={{ background: T.card, borderRadius: 12, padding: "14px 18px", border: `1px solid ${T.border}`, marginBottom: 16 }}>
      <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>APS tracker</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {aps !== null && (
          <div style={{ flex: 1, minWidth: 100, background: T.secondary, borderRadius: 10, padding: "10px 14px" }}>
            <p style={{ margin: "0 0 2px", fontSize: 11, color: T.muted, fontWeight: 600 }}>Your APS</p>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.primary }}>{aps}</p>
          </div>
        )}
        {careerApsMin && (
          <div style={{ flex: 1, minWidth: 100, background: careerApsMin ? (onTrack ? "#DCFCE7" : "#FEF3C7") : T.secondary, borderRadius: 10, padding: "10px 14px" }}>
            <p style={{ margin: "0 0 2px", fontSize: 11, color: T.muted, fontWeight: 600 }}>Required APS</p>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: onTrack ? T.teal : T.amber }}>{careerApsMin}+</p>
          </div>
        )}
        {gap !== null && (
          <div style={{ flex: 1, minWidth: 100, background: onTrack ? "#DCFCE7" : "#FEF2F2", borderRadius: 10, padding: "10px 14px" }}>
            <p style={{ margin: "0 0 2px", fontSize: 11, color: T.muted, fontWeight: 600 }}>{onTrack ? "Status" : "Gap"}</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: onTrack ? T.teal : T.coral }}>
              {onTrack ? "✓ On track" : `Need ${gap} more pts`}
            </p>
          </div>
        )}
      </div>
      {aps === null && (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: T.muted }}>
          Add marks to your subjects on your <a href="/learner/profile" style={{ color: T.primary, fontWeight: 700 }}>profile</a> to calculate your APS.
        </p>
      )}
    </div>
  );
}

// ── Subject gap analysis ──────────────────────────────────────────────────────

function SubjectGapBanner({ learnerSubjects, careerSubjectReqs }: {
  learnerSubjects: Array<{ subject: string; mark?: number | null }>;
  careerSubjectReqs: Record<string, number> | null;
}) {
  if (!careerSubjectReqs || !Object.keys(careerSubjectReqs).length) return null;

  const learnerNames = new Set(learnerSubjects.map((s) => s.subject.toLowerCase().trim()));
  const reqEntries   = Object.entries(careerSubjectReqs);

  const matched = reqEntries.filter(([s]) => {
    const sl = s.toLowerCase();
    return [...learnerNames].some((ln) => ln.includes(sl) || sl.includes(ln));
  });
  const missing = reqEntries.filter(([s]) => {
    const sl = s.toLowerCase();
    return ![...learnerNames].some((ln) => ln.includes(sl) || sl.includes(ln));
  });

  if (!matched.length && !missing.length) return null;

  return (
    <div style={{ background: T.card, borderRadius: 12, padding: "14px 18px", border: `1px solid ${T.border}`, marginBottom: 16 }}>
      <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Subject alignment</p>
      {matched.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: T.teal }}>✓ Subjects you have</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {matched.map(([sub, lvl]) => (
              <span key={sub} style={{ fontSize: 12, background: "#DCFCE7", color: "#166534", borderRadius: 8, padding: "3px 10px", fontWeight: 600 }}>
                {sub} (Level {lvl}+)
              </span>
            ))}
          </div>
        </div>
      )}
      {missing.length > 0 && (
        <div>
          <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: T.coral }}>⚠ Subjects to consider</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {missing.map(([sub, lvl]) => (
              <span key={sub} style={{ fontSize: 12, background: "#FEF2F2", color: "#991B1B", borderRadius: 8, padding: "3px 10px", fontWeight: 600 }}>
                {sub} (Level {lvl}+ needed)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pathway helpers ───────────────────────────────────────────────────────────

function StepCard({ step, index, total }: { step: any; index: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
          {index + 1}
        </div>
        {index < total - 1 && <div style={{ width: 2, flex: 1, background: T.border, margin: "4px 0", minHeight: 24 }} />}
      </div>
      <div style={{ paddingBottom: index < total - 1 ? 20 : 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.fg }}>{step.title}</p>
          {step.duration && (
            <span style={{ fontSize: 11, color: T.muted, background: T.secondary, borderRadius: 99, padding: "2px 8px" }}>{step.duration}</span>
          )}
        </div>
        {step.description && <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{step.description}</p>}
      </div>
    </div>
  );
}

function pathwayRequiresMaths(pathway: any): boolean {
  const text = [pathway.entryRequirements, pathway.title, pathway.subjectRequirements].filter(Boolean).join(" ");
  const cleaned = text.replace(/mathematical\s+literacy/gi, "");
  return /\bmathematics\b/i.test(cleaned) || /\bmaths\b/i.test(cleaned);
}

function MathsBanner({ learnerSubjects }: { learnerSubjects: string[] }) {
  const hasMaths    = learnerSubjects.includes("Mathematics");
  const hasMathsLit = learnerSubjects.includes("Mathematical Literacy");

  if (hasMaths) return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "#DCFCE7", border: "1px solid #86EFAC" }}>
      <span style={{ fontSize: 15 }}>✅</span>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#166534" }}>You're taking Mathematics — this pathway is open to you.</p>
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

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: T.secondary, border: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 15 }}>📚</span>
      <p style={{ margin: 0, fontSize: 12, color: T.muted }}>
        This pathway requires Mathematics. <a href="/learner/profile" style={{ color: T.primary, fontWeight: 700 }}>Add your subjects</a> to see if you qualify.
      </p>
    </div>
  );
}

function PathwayCard({ pathway, selected, onSelect, learnerSubjectNames }: {
  pathway: any; selected: boolean; onSelect: () => void; learnerSubjectNames: string[];
}) {
  const meta    = PATHWAY_META[pathway.type] ?? { icon: "📌", label: pathway.type, color: T.primary, desc: "" };
  const steps: any[] = pathway.steps ?? [];
  const needsMaths = pathwayRequiresMaths(pathway);

  return (
    <div onClick={onSelect} style={{ background: T.card, borderRadius: 16, overflow: "hidden", border: `2px solid ${selected ? meta.color : T.border}`, cursor: "pointer", transition: "border-color 0.15s" }}>
      <div style={{ padding: "14px 18px", background: selected ? meta.color + "0e" : "transparent", display: "flex", alignItems: "flex-start", gap: 12, borderBottom: `1px solid ${T.border}` }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>{meta.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.fg }}>{pathway.title || meta.label}</p>
            {selected && <span style={{ fontSize: 11, fontWeight: 700, background: meta.color, color: "#fff", borderRadius: 99, padding: "2px 8px" }}>Selected</span>}
          </div>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: T.muted }}>{meta.desc}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
          {pathway.durationLabel && (
            <span style={{ fontSize: 11, color: meta.color, fontWeight: 700, background: meta.color + "18", borderRadius: 99, padding: "2px 8px", whiteSpace: "nowrap" }}>⏱ {pathway.durationLabel}</span>
          )}
          {pathway.earnWhileLearn && (
            <span style={{ fontSize: 11, color: T.teal, fontWeight: 700, background: T.teal + "18", borderRadius: 99, padding: "2px 8px" }}>💰 Earn while learning</span>
          )}
        </div>
      </div>

      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
        {pathway.entryRequirements && (
          <div style={{ background: "#FEF3C7", borderRadius: 10, padding: "10px 14px" }}>
            <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 700, color: T.amber, textTransform: "uppercase", letterSpacing: "0.05em" }}>Entry requirements</p>
            <p style={{ margin: 0, fontSize: 13, color: "#92400E", lineHeight: 1.55 }}>{pathway.entryRequirements}</p>
          </div>
        )}
        {needsMaths && <MathsBanner learnerSubjects={learnerSubjectNames} />}
        {steps.length > 0 && (
          <div>
            <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Your journey — {steps.length} steps</p>
            {steps.map((step: any, i: number) => <StepCard key={i} step={step} index={i} total={steps.length} />)}
          </div>
        )}
        {(pathway.fundingOptions ?? []).length > 0 && (
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Funding options</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(pathway.fundingOptions as string[]).map((f) => (
                <span key={f} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 99, background: T.teal + "14", color: T.teal, fontWeight: 600 }}>✓ {f}</span>
              ))}
            </div>
          </div>
        )}
        {(pathway.estimatedCostMin || pathway.estimatedCostMax) && (
          <div style={{ display: "flex", gap: 12 }}>
            {pathway.estimatedCostMin && (
              <div style={{ flex: 1, background: T.secondary, borderRadius: 10, padding: "10px 14px" }}>
                <p style={{ margin: 0, fontSize: 11, color: T.muted, fontWeight: 600 }}>FROM</p>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.primary }}>R{Number(pathway.estimatedCostMin).toLocaleString("en-ZA")}/yr</p>
              </div>
            )}
            {pathway.estimatedCostMax && (
              <div style={{ flex: 1, background: T.secondary, borderRadius: 10, padding: "10px 14px" }}>
                <p style={{ margin: 0, fontSize: 11, color: T.muted, fontWeight: 600 }}>UP TO</p>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.primary }}>R{Number(pathway.estimatedCostMax).toLocaleString("en-ZA")}/yr</p>
              </div>
            )}
          </div>
        )}
        {pathway.costNote && <p style={{ margin: "-8px 0 0", fontSize: 12, color: T.muted, fontStyle: "italic" }}>{pathway.costNote}</p>}
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

// ── Main page ─────────────────────────────────────────────────────────────────

export function RoadmapPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const focusSlug    = searchParams.get("career");

  const [user,              setUser]              = useState<any>(null);
  const [profile,           setProfile]           = useState<any>(null);
  const [pathways,          setPathways]          = useState<any[]>([]);
  const [activeCareerId,    setActiveCareerId]    = useState<string>("");
  const [activeCareer,      setActiveCareer]      = useState<any>(null);
  const [selectedPathwayId, setSelectedPathwayId] = useState<string>("");
  const [loading,           setLoading]           = useState(true);
  const [saving,            setSaving]            = useState(false);
  const [saved,             setSaved]             = useState(false);
  const [pathwayLoading,    setPathwayLoading]    = useState(false);
  const [error,             setError]             = useState("");

  useEffect(() => {
    // Clear roadmap-updated badge when learner visits this page
    if (typeof window !== "undefined") localStorage.removeItem("roadmapUpdated");

    const load = async () => {
      try {
        const [userRes, matchRes] = await Promise.allSettled([
          apiClient.get("/users/me"),
          apiClient.post("/learner/profile/match"),
        ]);

        const u = userRes.status === "fulfilled" ? userRes.value.data.data.user : null;
        setUser(u);

        let p: any = null;
        if (matchRes.status === "fulfilled") {
          p = matchRes.value.data.data;
        } else {
          const profileRes = await apiClient.get("/learner/profile");
          p = profileRes.data.data;
        }

        setProfile(p);
        const matches: any[] = p?.careerMatches ?? [];

        // If arriving via "View my roadmap →" from a specific career, prefer that career
        if (focusSlug) {
          const focused = matches.find((m: any) => m.career.slug === focusSlug);
          if (focused) {
            setActiveCareerId(focused.career.id);
          } else {
            // Career might not be in top-10 matches — fetch it directly
            try {
              const r = await apiClient.get(`/careers/${focusSlug}`);
              const c = r.data.data;
              if (c?.id) {
                setActiveCareerId(c.id);
                setActiveCareer(c);
              }
            } catch {}
          }
          return;
        }

        if (p?.chosenCareerId) {
          setActiveCareerId(p.chosenCareerId);
        } else if (matches.length) {
          setActiveCareerId(matches[0].career.id);
        }
      } catch {
        setError("Could not load your profile.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!activeCareerId) return;
    setPathwayLoading(true);
    setPathways([]);
    setSelectedPathwayId("");

    const match = profile?.careerMatches?.find((m: any) => m.career.id === activeCareerId);
    const savedMatch = (profile?.savedCareers ?? []).find((s: any) => (s.career?.id ?? s.careerId) === activeCareerId);
    setActiveCareer(match?.career ?? savedMatch?.career ?? null);

    apiClient.get(`/pathways/career/${activeCareerId}`)
      .then((r) => {
        const raw: any[] = r.data.data?.pathways ?? r.data.data ?? [];
        const seen = new Set<string>();
        const pw = raw.filter((p) => { if (seen.has(p.type)) return false; seen.add(p.type); return true; });
        setPathways(pw);
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
        chosenCareerId:    activeCareerId,
        chosenPathwayType: pathways.find((p) => p.id === selectedPathwayId)?.type ?? undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      // Signal other pages that the roadmap has been updated
      if (typeof window !== "undefined") {
        localStorage.setItem("roadmapUpdated", "1");
        window.dispatchEvent(new CustomEvent("roadmap-updated"));
        window.dispatchEvent(new CustomEvent("profile-updated"));
      }
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

  const matches    = profile?.careerMatches ?? [];
  const hasMatches = matches.length > 0;

  // Saved careers that aren't already in the matches list
  const matchIds     = new Set(matches.map((m: any) => m.career.id));
  const savedExtras: any[] = (profile?.savedCareers ?? [])
    .filter((s: any) => !matchIds.has(s.career?.id ?? s.careerId))
    .map((s: any) => s.career)
    .filter(Boolean);
  const grade      = parseInt(user?.grade ?? "0") || 0;
  const isGrade9   = grade === 9;
  const isGrade10Plus = grade >= 10 && grade <= 12;

  const subjectsRaw: Array<{ subject: string; mark?: number | null }> =
    Array.isArray(profile?.subjects) ? profile.subjects : [];
  const hasSubjects    = subjectsRaw.length > 0;
  const learnerSubjectNames = subjectsRaw.map((s) => s.subject ?? "").filter(Boolean);

  const selectedPathway = pathways.find((p) => p.id === selectedPathwayId);
  const isGoalSet       = profile?.chosenCareerId === activeCareerId;

  // Career's entry requirements (now on career model)
  const careerApsMin:     number | null               = activeCareer?.apsMin ?? null;
  const careerSubjectReqs: Record<string, number> | null = activeCareer?.subjectRequirements ?? null;

  // ── No assessments yet ────────────────────────────────────────────────────
  if (!hasMatches) return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px 60px", fontFamily: "inherit" }}>
      <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: T.fg }}>My Roadmap</h1>
      <p style={{ margin: "0 0 32px", fontSize: 14, color: T.muted }}>Your personalised plan to reach your career goal</p>
      <div style={{ background: T.card, borderRadius: 16, padding: "32px 28px", border: `1px solid ${T.border}`, textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
        <p style={{ fontSize: 40, margin: "0 0 12px" }}>🗺️</p>
        <p style={{ fontSize: 16, fontWeight: 700, color: T.fg, margin: "0 0 8px" }}>Complete your assessments first</p>
        <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, margin: "0 0 20px" }}>
          Your roadmap is built from your career matches. Take the Interest Assessment to unlock your personalised career plan.
        </p>
        <button onClick={() => router.push("/learner/assessments")} style={{ padding: "10px 24px", borderRadius: 10, background: T.primary, color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Take assessments →
        </button>
      </div>
    </div>
  );

  // ── Grade 10-12: require subjects before showing roadmap ──────────────────
  if (isGrade10Plus && !hasSubjects) return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px 60px", fontFamily: "inherit" }}>
      <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: T.fg }}>My Roadmap</h1>
      <p style={{ margin: "0 0 32px", fontSize: 14, color: T.muted }}>Your personalised plan to reach your career goal</p>
      <div style={{ background: T.card, borderRadius: 16, padding: "32px 28px", border: `1px solid ${T.border}`, textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
        <p style={{ fontSize: 40, margin: "0 0 12px" }}>📚</p>
        <p style={{ fontSize: 16, fontWeight: 700, color: T.fg, margin: "0 0 8px" }}>Add your subjects first</p>
        <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, margin: "0 0 20px" }}>
          You're in Grade {grade} — you've already chosen a stream. Add your subjects so we can check if you're on track for your career goal and calculate your APS.
        </p>
        <button onClick={() => router.push("/learner/profile")} style={{ padding: "10px 24px", borderRadius: 10, background: T.primary, color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Add subjects →
        </button>
      </div>
    </div>
  );

  return (
    <div className="roadmap-wrap" style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px 60px", fontFamily: "inherit", overflowX: "hidden", maxWidth: "100%" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: T.fg }}>My Roadmap</h1>
        <p style={{ margin: 0, fontSize: 14, color: T.muted }}>
          {isGrade9 ? "Choose a stream and explore your career direction" : "Choose a career goal and explore how to get there"}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, alignItems: "start" }} className="roadmap-grid">

        {/* LEFT — Career selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {isGoalSet && (
            <div style={{ background: T.teal + "12", border: `1px solid ${T.teal}30`, borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🎯</span>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.teal }}>Active goal</p>
                <p style={{ margin: 0, fontSize: 11, color: T.muted }}>This is your current career target</p>
              </div>
            </div>
          )}

          <div className="roadmap-career-list" style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}` }}>
            <div className="roadmap-career-list-header" style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>
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
                  className="roadmap-career-btn"
                  style={{
                    width: "100%", textAlign: "left", display: "flex", alignItems: "center",
                    gap: 10, padding: "12px 16px",
                    background: isActive ? T.primary + "0c" : "transparent",
                    border: "none", borderBottom: i < matches.length - 1 ? `1px solid ${T.border}` : "none",
                    cursor: "pointer", transition: "background 0.12s",
                  }}
                >
                  <div className="roadmap-career-btn-rank" style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: isActive ? T.primary : T.secondary, color: isActive ? "#fff" : T.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? T.fg : T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.career.title}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{m.career.cluster?.name}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? T.primary : T.muted, flexShrink: 0 }}>
                    {Math.round(m.matchPercentage)}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Saved careers not in top matches */}
          {savedExtras.length > 0 && (
            <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  ♥ Saved careers
                </p>
              </div>
              {savedExtras.map((career: any) => {
                const isActive = career.id === activeCareerId;
                return (
                  <button
                    key={career.id}
                    onClick={() => setActiveCareerId(career.id)}
                    style={{
                      width: "100%", textAlign: "left", display: "flex", alignItems: "center",
                      gap: 10, padding: "12px 16px",
                      background: isActive ? T.primary + "0c" : "transparent",
                      border: "none", borderBottom: `1px solid ${T.border}`,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: isActive ? T.primary : "#FFF1F2", color: isActive ? "#fff" : T.coral, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                      ♥
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? T.fg : T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {career.title}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{career.cluster?.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={handleSetGoal}
              disabled={saving || !activeCareerId}
              style={{ padding: "10px 0", borderRadius: 10, border: "none", background: saved ? T.teal : T.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "background 0.2s", opacity: saving ? 0.7 : 1 }}
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

        {/* RIGHT — Pathways / Grade 9 stream guide */}
        <div>
          {activeCareer && (
            <div style={{ background: T.card, borderRadius: 16, padding: "16px 20px", border: `1px solid ${T.border}`, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {isGrade9 ? "Career you're exploring" : "Pathways to become a"}
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

          {/* APS & subject gap — Grade 10-12 only */}
          {isGrade10Plus && hasSubjects && (
            <>
              <APSBanner learnerSubjects={subjectsRaw} careerApsMin={careerApsMin} />
              <SubjectGapBanner learnerSubjects={subjectsRaw} careerSubjectReqs={careerSubjectReqs} />
            </>
          )}

          {/* Grade 9 — show stream guidance */}
          {isGrade9 && profile?.riasecType && (
            <Grade9StreamGuide riasecType={profile.riasecType} />
          )}

          {/* Grade 10-12 — show pathways */}
          {!isGrade9 && (
            <>
              {pathways.length > 1 && (
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  {pathways.map((pw) => {
                    const meta = PATHWAY_META[pw.type] ?? { icon: "📌", label: pw.type, color: T.primary };
                    const isSel = pw.id === selectedPathwayId;
                    return (
                      <button key={pw.id} onClick={() => setSelectedPathwayId(pw.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 99, border: `1.5px solid ${isSel ? meta.color : T.border}`, background: isSel ? meta.color + "12" : T.card, color: isSel ? meta.color : T.muted, fontSize: 12, fontWeight: isSel ? 700 : 500, cursor: "pointer", transition: "all 0.12s" }}>
                        {meta.icon} {meta.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {pathwayLoading && (
                <div style={{ background: T.card, borderRadius: 16, padding: 32, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 13, gap: 10 }}>
                  <div style={{ width: 20, height: 20, border: `2px solid ${T.primary}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  Loading pathways…
                </div>
              )}

              {!pathwayLoading && pathways.length === 0 && (
                <div style={{ background: T.card, borderRadius: 16, padding: "32px 28px", border: `1px solid ${T.border}`, textAlign: "center" }}>
                  <p style={{ fontSize: 36, margin: "0 0 12px" }}>🛤️</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: T.fg, margin: "0 0 8px" }}>No pathways generated yet</p>
                  <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, margin: "0 0 20px", maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
                    Pathways for this career haven't been generated yet. Check back soon or explore the career for more information.
                  </p>
                  <button onClick={() => activeCareer && router.push(`/learner/careers/${activeCareer.slug}`)} style={{ padding: "9px 20px", borderRadius: 10, background: T.primary, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    View career details →
                  </button>
                </div>
              )}

              {!pathwayLoading && selectedPathway && (
                <PathwayCard pathway={selectedPathway} selected={true} onSelect={() => {}} learnerSubjectNames={learnerSubjectNames} />
              )}

              {!pathwayLoading && pathways.length > 1 && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Other routes</p>
                  {pathways.filter((pw) => pw.id !== selectedPathwayId).map((pw) => {
                    const meta = PATHWAY_META[pw.type] ?? { icon: "📌", label: pw.type, color: T.primary };
                    return (
                      <button key={pw.id} onClick={() => setSelectedPathwayId(pw.id)} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, cursor: "pointer", transition: "border-color 0.12s" }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = meta.color)} onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}>
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
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .roadmap-wrap {
            padding: 16px 14px 80px !important;
            overflow-x: hidden !important;
            max-width: 100vw !important;
            box-sizing: border-box !important;
          }
          .roadmap-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            min-width: 0 !important;
          }
          .roadmap-career-list-header {
            display: none !important;
          }
          /* Collapse career list to a horizontal scrolling strip on mobile */
          .roadmap-career-list {
            display: flex !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            gap: 8px !important;
            padding: 8px !important;
            scrollbar-width: none !important;
            border-radius: 16px !important;
          }
          .roadmap-career-list::-webkit-scrollbar { display: none; }
          .roadmap-career-btn {
            flex-shrink: 0 !important;
            flex-direction: column !important;
            border-radius: 12px !important;
            padding: 10px 14px !important;
            min-width: 130px !important;
            border: 1.5px solid rgba(91,79,207,0.15) !important;
          }
          .roadmap-career-btn-rank {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
