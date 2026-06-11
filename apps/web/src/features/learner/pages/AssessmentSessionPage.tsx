"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import apiClient from "@/api/client";

const T = {
  primary:   "#5B4FCF",
  secondary: "#EEE9FF",
  coral:     "#F97066",
  teal:      "#0D9488",
  bg:        "#FAFAF9",
  card:      "#FFFFFF",
  fg:        "#1A1535",
  muted:     "#7A7499",
  border:    "rgba(91,79,207,0.12)",
};

const ASSESSMENT_META: Record<string, { icon: string; name: string; color: string; desc: string }> = {
  INTEREST:    { icon: "🎯", name: "Interest",    color: "#5B4FCF", desc: "Discover what energises you most" },
  APTITUDE:    { icon: "🧠", name: "Aptitude",    color: "#0D9488", desc: "Measure your strengths and reasoning" },
  PERSONALITY: { icon: "✨", name: "Personality", color: "#D97706", desc: "Understand how you see the world" },
  VALUES:      { icon: "💡", name: "Values",       color: "#7C3AED", desc: "Identify what matters most to you" },
};

const RIASEC_LABEL: Record<string, string> = {
  R: "Realistic", I: "Investigative", A: "Artistic",
  S: "Social",    E: "Enterprising",  C: "Conventional",
};
const RIASEC_COLOR: Record<string, string> = {
  R: "#ef4444", I: "#3b82f6", A: "#f59e0b",
  S: "#22c55e", E: "#8b5cf6", C: "#f97316",
};

// ── Results screen ─────────────────────────────────────────────────────────────

function ResultsScreen({
  type, results, onBack,
}: { type: string; results: any; onBack: () => void }) {
  const router  = useRouter();
  const meta    = ASSESSMENT_META[type] ?? ASSESSMENT_META.INTEREST;
  const scores: Record<string, number> = results?.riasecScores ?? {};
  const topType: string = results?.riasecType ?? "";
  const tally: Record<string, number> = results?.tally ?? {};

  const maxScore = Math.max(...Object.values(scores), 1);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "inherit" }}>
      {/* Top bar */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          <ArrowLeft size={15} /> Assessments
        </button>
        <span style={{ color: T.border, fontSize: 18 }}>/</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.fg }}>{meta.icon} {meta.name} Results</span>
      </div>

      <div style={{ padding: "32px 24px 60px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%", margin: "0 auto 16px",
            background: `${meta.color}18`, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36,
          }}>
            {meta.icon}
          </div>
          <CheckCircle2 size={28} color={T.teal} style={{ marginBottom: 8 }} />
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: T.fg }}>Assessment Complete!</h1>
          <p style={{ margin: 0, fontSize: 14, color: T.muted }}>{meta.name} assessment · Results below</p>
        </div>

        {/* RIASEC results (Interest assessment) */}
        {type === "INTEREST" && Object.keys(scores).length > 0 && (
          <div style={{ background: T.card, borderRadius: 16, padding: "20px 24px", border: `1px solid ${T.border}`, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: T.fg }}>Your RIASEC Profile</h3>
            {topType && (
              <p style={{ margin: "0 0 20px", fontSize: 13, color: T.muted }}>
                Your dominant type: <strong style={{ color: T.primary }}>
                  {topType.split("").map((c) => RIASEC_LABEL[c] ?? c).join(" · ")}
                </strong>
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.entries(scores)
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .map(([code, score]) => {
                  const pct = Math.round(((score as number) / maxScore) * 100);
                  const color = RIASEC_COLOR[code] ?? T.primary;
                  return (
                    <div key={code}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.fg }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 20, height: 20, borderRadius: "50%", fontSize: 11, fontWeight: 800,
                            background: color + "20", color, marginRight: 8,
                          }}>{code}</span>
                          {RIASEC_LABEL[code] ?? code}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color }}>{score as number} pts</span>
                      </div>
                      <div style={{ height: 8, background: T.secondary, borderRadius: 99 }}>
                        <div style={{
                          width: `${pct}%`, height: "100%", borderRadius: 99,
                          background: color, transition: "width 0.6s ease",
                        }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Other assessment result summary */}
        {type !== "INTEREST" && Object.keys(tally).length > 0 && (
          <div style={{ background: T.card, borderRadius: 16, padding: "20px 24px", border: `1px solid ${T.border}`, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: T.fg }}>Your Responses</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(tally)
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .map(([val, count]) => {
                  const total = Object.values(tally).reduce((s: number, c) => s + (c as number), 0);
                  const pct = Math.round(((count as number) / total) * 100);
                  return (
                    <div key={val}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: T.fg, fontWeight: 500 }}>{val}</span>
                        <span style={{ fontSize: 12, color: T.muted }}>{count as number}× ({pct}%)</span>
                      </div>
                      <div style={{ height: 6, background: T.secondary, borderRadius: 99 }}>
                        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: meta.color }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => router.push("/learner/assessments")}
            style={{ padding: "13px 20px", borderRadius: 12, background: T.primary, color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
          >
            Back to all assessments →
          </button>
          <button
            onClick={() => router.push("/learner/profile")}
            style={{ padding: "13px 20px", borderRadius: 12, background: T.secondary, color: T.primary, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
          >
            View career matches
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Session screen (take the test) ─────────────────────────────────────────────

export function AssessmentSessionPage({ typeSlug }: { typeSlug: string }) {
  const router  = useRouter();
  const type    = typeSlug.toUpperCase();
  const meta    = ASSESSMENT_META[type] ?? ASSESSMENT_META.INTEREST;

  const [phase,       setPhase]       = useState<"loading" | "questions" | "submitting" | "results">("loading");
  const [questions,   setQuestions]   = useState<any[]>([]);
  const [answered,    setAnswered]    = useState<Record<string, string>>({});
  const [skipped,     setSkipped]     = useState<string[]>([]);
  const [current,     setCurrent]     = useState(0);
  const [results,     setResults]     = useState<any>(null);
  const [error,       setError]       = useState("");

  // Init: start session + fetch questions
  useEffect(() => {
    const init = async () => {
      try {
        // Start or resume session — returns already-answered IDs
        const startRes = await apiClient.post(`/assessments/${type}/start`);
        const answeredIds: string[] = startRes.data.data.answeredQuestionIds ?? [];

        // Fetch the question set for this type (15 or 20 depending on type)
        const qRes = await apiClient.get(`/assessments/${type}/questions`);
        const qs: any[] = qRes.data.data ?? [];

        setQuestions(qs);

        // Pre-populate answered map from session (we don't have the values, just IDs)
        // Find the first unanswered question to start from
        const firstUnanswered = qs.findIndex((q) => !answeredIds.includes(q.id));
        setCurrent(Math.max(0, firstUnanswered === -1 ? qs.length : firstUnanswered));

        // Mark already-answered questions in state (value unknown, just mark as done)
        const preAnswered: Record<string, string> = {};
        for (const id of answeredIds) preAnswered[id] = "__answered__";
        setAnswered(preAnswered);

        // If all already answered, jump to submit
        if (answeredIds.length >= qs.length && qs.length > 0) {
          setCurrent(qs.length);
        }

        setPhase("questions");
      } catch (e: any) {
        if (e?.response?.status === 409) {
          // Already completed — fetch results
          try {
            const sessRes = await apiClient.get("/assessments/me");
            const mySession = (sessRes.data.data ?? []).find((s: any) => s.assessmentType === type);
            if (mySession?.results) {
              setResults(mySession.results);
              setPhase("results");
              return;
            }
          } catch {}
        }
        setError("Could not load this assessment. Please try again.");
        setPhase("questions");
      }
    };
    init();
  }, [type]);

  // answered stores "optionIndex" for display (always unique), answerValue sent to API is the actual opt.value
  const handleSelect = useCallback((questionId: string, optIndex: number, optValue: string) => {
    // Update UI immediately — store the option INDEX so duplicate values never highlight multiple rows
    setAnswered((prev) => ({ ...prev, [questionId]: String(optIndex) }));
    setSkipped((prev) => prev.filter((id) => id !== questionId));
    // Persist in background — fire and forget
    apiClient.post(`/assessments/${type}/answer`, { questionId, answerValue: optValue }).catch(() => {});
  }, [type]);

  const handleNext = () => setCurrent((prev) => Math.min(prev + 1, questions.length - 1));
  const handlePrev = () => setCurrent((prev) => Math.max(prev - 1, 0));
  const handleSkip = () => {
    if (question) setSkipped((prev) => prev.includes(question.id) ? prev : [...prev, question.id]);
    setCurrent((prev) => Math.min(prev + 1, questions.length - 1));
  };
  const handleFinish = () => setCurrent(questions.length); // jump to summary screen

  const handleComplete = async () => {
    setPhase("submitting");
    try {
      const res = await apiClient.post(`/assessments/${type}/complete`);
      setResults(res.data.data.results);
      setPhase("results");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Could not complete assessment");
      setPhase("questions");
    }
  };

  // ── Results screen ────────────────────────────────────────────────────────────
  if (phase === "results") {
    return (
      <ResultsScreen
        type={type}
        results={results}
        onBack={() => router.push("/learner/assessments")}
      />
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 14 }}>
        Loading {meta.name} assessment…
      </div>
    );
  }

  // ── Submitting ────────────────────────────────────────────────────────────────
  if (phase === "submitting") {
    return (
      <div style={{ background: T.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: T.muted, fontSize: 14 }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${T.primary}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <p style={{ margin: 0, fontWeight: 600 }}>Calculating your results…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Questions ─────────────────────────────────────────────────────────────────
  const realAnsweredCount = Object.values(answered).filter(v => v !== "__answered__").length
                          + Object.values(answered).filter(v => v === "__answered__").length;
  const answeredCount = Object.keys(answered).length;
  const progressPct   = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  // Clamp current to valid range; when current === questions.length → summary screen
  const questionIndex  = Math.min(current, questions.length - 1);
  const question       = current < questions.length ? questions[questionIndex] : null;
  const options: any[] = question ? (Array.isArray(question.options) ? question.options : []) : [];
  // selectedOptIdx is the index of the chosen option — null if unanswered or only pre-answered (no value known)
  const selectedOptIdx = question
    ? (answered[question.id] && answered[question.id] !== "__answered__" ? Number(answered[question.id]) : null)
    : null;
  const isLastQuestion = questionIndex === questions.length - 1;
  const onSummary      = current >= questions.length;

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "inherit" }}>

      {/* Top bar */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => router.push("/learner/assessments")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          <ArrowLeft size={15} /> Assessments
        </button>
        <span style={{ color: T.border, fontSize: 18 }}>/</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.fg }}>{meta.icon} {meta.name}</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: T.muted, fontWeight: 600 }}>
          {answeredCount} / {questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: T.secondary }}>
        <div style={{ width: `${progressPct}%`, height: "100%", background: meta.color, transition: "width 0.3s ease" }} />
      </div>

      {/* Body */}
      <div className="assess-body" style={{ display: "flex", minHeight: "calc(100vh - 68px)" }}>

        {/* ── Sidebar: question navigator (desktop only) ── */}
        <aside className="assess-sidebar" style={{
          width: 220, flexShrink: 0,
          padding: "24px 16px",
          borderRight: `1px solid ${T.border}`,
          background: T.card,
          overflowY: "auto",
        }}>
          <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: T.muted }}>
            Questions
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {questions.map((q, i) => {
              const isAns     = !!(answered[q.id]);
              const isSkip    = skipped.includes(q.id);
              const isCurrent = i === questionIndex && !onSummary;
              const bg = isCurrent ? meta.color
                       : isSkip    ? "#f59e0b"
                       : isAns     ? "#22c55e"
                       : T.secondary;
              const fg = isCurrent || isSkip || isAns ? "#fff" : T.muted;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrent(i)}
                  title={`Question ${i + 1}${isAns ? " — answered" : isSkip ? " — skipped" : ""}`}
                  style={{
                    width: 34, height: 34, borderRadius: "50%", border: "none",
                    background: bg, color: fg,
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    transition: "all 0.15s",
                    boxShadow: isCurrent ? `0 0 0 3px ${meta.color}40` : "none",
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              { color: meta.color,  label: "Current"  },
              { color: "#22c55e",   label: "Answered"  },
              { color: "#f59e0b",   label: "Skipped"   },
              { color: T.secondary, label: "Not yet",  fg: T.muted },
            ].map(({ color, label, fg: lfg }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: lfg ?? T.muted }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Submit shortcut from sidebar */}
          {answeredCount > 0 && (
            <button
              onClick={() => setCurrent(questions.length)}
              style={{
                marginTop: 24, width: "100%",
                padding: "9px 0", borderRadius: 10,
                background: `${meta.color}14`, color: meta.color,
                border: `1.5px solid ${meta.color}40`,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              Review & submit
            </button>
          )}
        </aside>

        {/* ── Main question area ── */}
        <main style={{ flex: 1, padding: "36px 48px 80px", overflowY: "auto" }}>

          {/* Error */}
          {error && (
            <div style={{ background: "#FEE2E2", color: "#991B1B", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, fontWeight: 600 }}>
              {error}
            </div>
          )}

          {questions.length === 0 ? (
            /* ── No questions available ── */
            <div style={{ textAlign: "center", padding: "60px 0", color: T.muted }}>
              <p style={{ fontSize: 32, margin: "0 0 12px" }}>🔒</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: T.fg, margin: "0 0 8px" }}>No questions available</p>
              <p style={{ fontSize: 13, margin: "0 0 20px" }}>The {meta.name} assessment questions are being reviewed. Check back soon.</p>
              <button onClick={() => router.push("/learner/assessments")} style={{ padding: "9px 20px", borderRadius: 99, background: T.primary, color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                ← Back
              </button>
            </div>

          ) : onSummary ? (
            /* ── Summary / submit screen ── */
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, paddingTop: 16 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: `${meta.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
                {meta.icon}
              </div>
              <div style={{ textAlign: "center" }}>
                <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: T.fg }}>
                  {answeredCount === questions.length ? "All questions answered!" : `${answeredCount} of ${questions.length} answered`}
                </h2>
                <p style={{ margin: 0, fontSize: 14, color: T.muted }}>
                  {skipped.length > 0 ? `${skipped.length} skipped — you can go back and answer them, or submit now.` : `Ready to see your ${meta.name.toLowerCase()} results?`}
                </p>
              </div>

              {/* All question dots (desktop sees this too) */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center", maxWidth: 380 }}>
                {questions.map((q, i) => {
                  const isAns  = !!(answered[q.id]);
                  const isSkip = skipped.includes(q.id);
                  const bg = isSkip ? "#f59e0b" : isAns ? "#22c55e" : T.secondary;
                  const fg = isSkip || isAns ? "#fff" : T.muted;
                  return (
                    <button key={q.id} onClick={() => setCurrent(i)} title={`Q${i + 1}`}
                      style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: bg, color: fg, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              <button onClick={handleComplete} style={{ padding: "14px 40px", borderRadius: 12, background: meta.color, color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 14px ${meta.color}40` }}>
                Submit & see results →
              </button>
              <button onClick={() => setCurrent(0)} style={{ padding: "10px 20px", borderRadius: 10, background: "none", border: `1px solid ${T.border}`, color: T.muted, fontSize: 13, cursor: "pointer" }}>
                ← Go back to questions
              </button>
            </div>

          ) : question ? (
            /* ── Single question ── */
            <div>
              <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: meta.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Question {questionIndex + 1} of {questions.length}
                {skipped.includes(question.id) && (
                  <span style={{ marginLeft: 8, color: "#f59e0b" }}>— skipped</span>
                )}
              </p>
              <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: T.fg, lineHeight: 1.45 }}>
                {question.questionText}
              </h2>
              {question.contextNote && (
                <p style={{ margin: "0 0 20px", fontSize: 13, color: T.muted, fontStyle: "italic", lineHeight: 1.5 }}>
                  {question.contextNote}
                </p>
              )}

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
                {options.map((opt: any, optIdx: number) => {
                  const optValue   = opt.value ?? opt.label;
                  const label      = opt.label ?? opt.text ?? optValue;
                  const isSelected = selectedOptIdx === optIdx;

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelect(question.id, optIdx, optValue)}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "15px 20px", borderRadius: 12, textAlign: "left", width: "100%",
                        background: isSelected ? `${meta.color}12` : T.card,
                        border: `2px solid ${isSelected ? meta.color : T.border}`,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = `${meta.color}50`; }}
                      onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = T.border; }}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${isSelected ? meta.color : T.border}`,
                        background: isSelected ? meta.color : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s",
                      }}>
                        {isSelected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: isSelected ? 600 : 400, color: isSelected ? meta.color : T.fg, lineHeight: 1.45 }}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 32, gap: 10 }}>
                {/* Previous */}
                <button
                  onClick={handlePrev}
                  disabled={questionIndex === 0}
                  style={{
                    padding: "10px 20px", borderRadius: 10,
                    background: "none", border: `1.5px solid ${T.border}`,
                    color: questionIndex === 0 ? T.secondary : T.muted,
                    fontSize: 13, fontWeight: 600,
                    cursor: questionIndex === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  ← Previous
                </button>

                {/* Skip + Next / Finish */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={handleSkip}
                    style={{
                      padding: "10px 18px", borderRadius: 10,
                      background: "none", border: `1.5px solid #f59e0b40`,
                      color: "#b45309", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Skip →
                  </button>
                  {isLastQuestion ? (
                    <button
                      onClick={handleFinish}
                      style={{
                        padding: "10px 20px", borderRadius: 10,
                        background: meta.color, color: "#fff",
                        border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      Finish →
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      style={{
                        padding: "10px 20px", borderRadius: 10,
                        background: selectedOptIdx !== null ? meta.color : T.secondary,
                        color: selectedOptIdx !== null ? "#fff" : T.muted,
                        border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      Next →
                    </button>
                  )}
                </div>
              </div>
            </div>

          ) : null}
        </main>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .assess-sidebar { display: none !important; }
          .assess-body main { padding: 24px 20px 80px !important; }
        }
      `}</style>
    </div>
  );
}
