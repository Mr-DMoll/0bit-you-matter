"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Clock, MapPin, BookOpen } from "lucide-react";
import apiClient from "@/api/client";

const T = {
  primary:  "#5B4FCF",
  secondary:"#EEE9FF",
  teal:     "#0D9488",
  coral:    "#F97066",
  amber:    "#D97706",
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

function formatDate(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function isOpen(open?: string | null, close?: string | null) {
  const now = Date.now();
  const o = open  ? new Date(open).getTime()  : null;
  const c = close ? new Date(close).getTime() : null;
  if (c && c < now) return "closed";
  if (o && o > now) return "upcoming";
  return "open";
}

export function CareerDetailPage({ slug }: { slug: string }) {
  const router = useRouter();

  const [career,     setCareer]     = useState<any>(null);
  const [saved,      setSaved]      = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [bursaries,  setBursaries]  = useState<any[]>([]);

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

        // Load programmes and bursaries in parallel (non-blocking)
        Promise.all([
          apiClient.get(`/careers/${slug}/programmes`).then((r) => setProgrammes(r.data.data ?? [])).catch(() => {}),
          apiClient.get(`/careers/${slug}/bursaries`).then((r) => setBursaries(r.data.data ?? [])).catch(() => {}),
        ]);
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
        await Promise.all([
          apiClient.post("/learner/saved-careers", { careerId: career.id }),
          // Also set as chosen career so the roadmap updates automatically
          apiClient.patch("/learner/profile", { chosenCareerId: career.id }),
        ]);
        setSaved(true);
        if (typeof window !== "undefined") {
          localStorage.setItem("roadmapUpdated", "1");
          window.dispatchEvent(new CustomEvent("roadmap-updated"));
        }
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

  const subjectReqs: Record<string, number> | null = career.subjectRequirements ?? null;

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "inherit" }}>

      {/* Sticky top bar */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
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
            <div className="salary-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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

          {/* Entry requirements — APS + subjects */}
          {(career.apsMin || subjectReqs) && (
            <Section title="Entry requirements">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {career.apsMin && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ background: T.primary, color: "#fff", borderRadius: 10, padding: "8px 16px", fontWeight: 800, fontSize: 18 }}>
                      {career.apsMin}+
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.fg }}>Minimum APS</p>
                      <p style={{ margin: 0, fontSize: 12, color: T.muted }}>Admission Point Score required for entry</p>
                    </div>
                  </div>
                )}
                {subjectReqs && Object.keys(subjectReqs).length > 0 && (
                  <div>
                    <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: T.muted }}>Required subjects</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {Object.entries(subjectReqs).map(([subject, level]) => (
                        <div key={subject} style={{ background: T.secondary, borderRadius: 10, padding: "6px 12px" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: T.primary }}>{subject}</span>
                          <span style={{ fontSize: 11, color: T.muted, marginLeft: 6 }}>Level {level}+</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ margin: "8px 0 0", fontSize: 11, color: T.muted }}>Achievement levels: 1 (30–39%) → 7 (80–100%)</p>
                  </div>
                )}
                {career.nqfLevelMin && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: T.secondary, borderRadius: 10, alignSelf: "flex-start" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.primary }}>NQF Level {career.nqfLevelMin}+</span>
                    <span style={{ fontSize: 11, color: T.muted }}>minimum qualification</span>
                  </div>
                )}
              </div>
            </Section>
          )}

          {career.overview      && <Section title="Overview"><p style={{ margin: 0, fontSize: 14, color: T.fg, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{career.overview}</p></Section>}
          {career.dayInTheLife  && <Section title="A day in the life"><p style={{ margin: 0, fontSize: 14, color: T.fg, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{career.dayInTheLife}</p></Section>}
          {career.howToGetThere && <Section title="How to get there"><p style={{ margin: 0, fontSize: 14, color: T.fg, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{career.howToGetThere}</p></Section>}
          {career.saContext     && <Section title="In South Africa"><p style={{ margin: 0, fontSize: 14, color: T.fg, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{career.saContext}</p></Section>}

          {/* Institutions offering this career */}
          {programmes.length > 0 && (
            <Section title={`Institutions offering this path (${programmes.length})`}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {programmes.map((uni: any) => (
                  <div key={uni.id} style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
                    {/* University header */}
                    <div style={{ padding: "12px 16px", background: T.secondary, display: "flex", alignItems: "center", gap: 10 }}>
                      {uni.logoUrl ? (
                        <img src={uni.logoUrl} alt={uni.name} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "contain", background: "#fff", padding: 2 }} />
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: T.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12 }}>
                          {(uni.abbreviation ?? uni.name).charAt(0)}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.fg }}>{uni.name}{uni.abbreviation ? ` (${uni.abbreviation})` : ""}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: T.muted }}>
                          <MapPin size={11} />{uni.province}
                        </div>
                      </div>
                      {uni.website && (
                        <a href={uni.website} target="_blank" rel="noopener noreferrer"
                          style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: T.primary, textDecoration: "none", flexShrink: 0 }}>
                          Visit <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    {/* Programmes */}
                    {uni.programmes.map((prog: any) => {
                      const appStatus = isOpen(prog.applicationOpenDate, prog.applicationCloseDate);
                      const statusColor = appStatus === "open" ? T.teal : appStatus === "upcoming" ? T.amber : T.muted;
                      const statusLabel = appStatus === "open" ? "Applications open" : appStatus === "upcoming" ? "Opening soon" : "Applications closed";
                      return (
                        <div key={prog.id} style={{ padding: "12px 16px", borderTop: `1px solid ${T.border}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: T.fg }}>{prog.name}</p>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                                {prog.faculty && <span style={{ fontSize: 11, color: T.muted }}>{prog.faculty}</span>}
                                {prog.duration && <span style={{ fontSize: 11, color: T.muted }}>· {prog.duration} yr{prog.duration !== 1 ? "s" : ""}</span>}
                                {prog.nqfLevel && <span style={{ fontSize: 11, color: T.muted }}>· NQF {prog.nqfLevel}</span>}
                              </div>
                              {/* APS */}
                              {prog.apsMin && (
                                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, background: T.primary + "18", color: T.primary, borderRadius: 6, padding: "2px 8px" }}>
                                    APS {prog.apsMin}+
                                  </span>
                                </div>
                              )}
                              {/* Application window */}
                              {(prog.applicationOpenDate || prog.applicationCloseDate) && (
                                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                                  <Clock size={11} color={statusColor} />
                                  <span style={{ color: statusColor, fontWeight: 600 }}>{statusLabel}</span>
                                  {prog.applicationOpenDate && <span style={{ color: T.muted }}>from {formatDate(prog.applicationOpenDate)}</span>}
                                  {prog.applicationCloseDate && <span style={{ color: T.muted }}>until {formatDate(prog.applicationCloseDate)}</span>}
                                </div>
                              )}
                              {/* Programme subject requirements */}
                              {prog.subjectRequirements && Object.keys(prog.subjectRequirements).length > 0 && (
                                <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                                  {Object.entries(prog.subjectRequirements as Record<string,number>).map(([sub, lvl]) => (
                                    <span key={sub} style={{ fontSize: 10, background: T.secondary, color: T.primary, borderRadius: 6, padding: "2px 6px", fontWeight: 600 }}>
                                      {sub} {lvl}+
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Linked bursaries */}
          {bursaries.length > 0 && (
            <Section title={`Bursaries for this field (${bursaries.length})`}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {bursaries.map((b: any) => {
                  const deadline = formatDate(b.closeDate);
                  const urgent   = b.closeDate && (new Date(b.closeDate).getTime() - Date.now()) < 7 * 86400000 && new Date(b.closeDate).getTime() > Date.now();
                  return (
                    <div key={b.id} style={{ padding: "12px 14px", border: `1px solid ${urgent ? T.coral + "40" : T.border}`, borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: T.fg }}>{b.name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{b.provider}</p>
                        {deadline && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: urgent ? T.coral : T.muted, marginTop: 3 }}>
                            <Clock size={10} />Closes {deadline}{urgent ? " — soon!" : ""}
                          </div>
                        )}
                      </div>
                      <a
                        href={`/learner/bursaries`}
                        style={{ fontSize: 12, fontWeight: 700, color: T.primary, textDecoration: "none", flexShrink: 0 }}
                      >
                        View →
                      </a>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* CTA */}
          <div style={{ background: T.primary + "08", borderRadius: 16, padding: "20px 24px", border: `1px solid ${T.primary}20` }}>
            <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: T.fg }}>Interested in this career?</p>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: T.muted }}>Save it to your profile and your roadmap will update automatically.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={handleSave} style={{ padding: "10px 20px", borderRadius: 10, background: saved ? T.teal : T.primary, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {saved ? "♥ Saved" : "♡ Save to profile"}
              </button>
              <button onClick={() => router.push(`/learner/roadmap${career?.slug ? `?career=${career.slug}` : ""}`)} style={{ padding: "10px 20px", borderRadius: 10, background: "none", border: `1.5px solid ${T.primary}`, color: T.primary, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                View my roadmap →
              </button>
              <button onClick={() => router.push("/learner/matches")} style={{ padding: "10px 20px", borderRadius: 10, background: "none", border: `1.5px solid ${T.border}`, color: T.muted, fontSize: 13, cursor: "pointer" }}>
                ← All matches
              </button>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 480px) {
          .salary-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
