"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/client";

const TYPES = ["INTEREST", "APTITUDE", "PERSONALITY", "VALUES"] as const;
type AType = typeof TYPES[number];

const META: Record<AType, { color: string; emoji: string; title: string; desc: string; minutes: number }> = {
  INTEREST:    { color: "#6366f1", emoji: "🔍", title: "Interest",    desc: "Discover what kinds of work and activities excite you most",       minutes: 10 },
  APTITUDE:    { color: "#3b82f6", emoji: "🧠", title: "Aptitude",    desc: "Find out where your natural strengths and abilities lie",           minutes: 12 },
  PERSONALITY: { color: "#8b5cf6", emoji: "🌟", title: "Personality", desc: "Understand your working style and how you prefer to collaborate",   minutes: 8  },
  VALUES:      { color: "#f59e0b", emoji: "❤️",  title: "Values",      desc: "What matters most to you in a career and workplace",              minutes: 7  },
};

export function AssessmentsPage() {
  const router = useRouter();
  const [sessions, setSessions]     = useState<any[]>([]);
  const [questions, setQuestions]   = useState<any[]>([]);
  const [answers, setAnswers]       = useState<Record<string, string>>({});
  const [activeType, setActiveType] = useState<AType | null>(null);
  const [sessionId, setSessionId]   = useState<string | null>(null);
  const [qIdx, setQIdx]             = useState(0);
  const [saving, setSaving]         = useState(false);
  const [done, setDone]             = useState(false);

  const loadSessions = useCallback(() => {
    apiClient.get("/learner/profile")
      .then((r) => setSessions(r.data.data?.assessmentSessions ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const getStatus = (type: AType) => {
    const s = sessions.find((s) => s.assessmentType === type);
    if (!s) return "NOT_STARTED";
    return s.status;
  };

  const startAssessment = async (type: AType) => {
    setDone(false); setAnswers({});
    try {
      const res = await apiClient.post("/assessments/sessions/start", { assessmentType: type });
      setSessionId(res.data.data.id);
      const qRes = await apiClient.get(`/assessments/sessions/${res.data.data.id}/questions`);
      setQuestions(qRes.data.data);
      setQIdx(0);
      setActiveType(type);
    } catch {}
  };

  const resumeAssessment = async (type: AType) => {
    const s = sessions.find((s) => s.assessmentType === type);
    if (!s) return;
    setSessionId(s.id); setDone(false); setAnswers({});
    try {
      const qRes = await apiClient.get(`/assessments/sessions/${s.id}/questions`);
      setQuestions(qRes.data.data);
      const answeredIds = new Set((s.answers ?? []).map((a: any) => a.questionId));
      const firstUnanswered = qRes.data.data.findIndex((q: any) => !answeredIds.has(q.id));
      setQIdx(firstUnanswered >= 0 ? firstUnanswered : 0);
      setActiveType(type);
    } catch {}
  };

  const saveAnswer = async (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setSaving(true);
    try {
      await apiClient.post(`/assessments/sessions/${sessionId}/answers`, { questionId, selectedValue: value });
    } catch {}
    setSaving(false);

    if (qIdx < questions.length - 1) {
      setQIdx((i) => i + 1);
    } else {
      try {
        await apiClient.post(`/assessments/sessions/${sessionId}/complete`);
        setDone(true);
        loadSessions();
      } catch {}
    }
  };

  if (activeType && questions.length > 0 && !done) {
    const q    = questions[qIdx];
    const meta = META[activeType];
    const opts: any[] = typeof q.options === "string" ? JSON.parse(q.options) : (q.options ?? []);

    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100svh - 130px)" }}>
        {/* header */}
        <div style={{ marginBottom: "24px" }}>
          <button onClick={() => setActiveType(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--color-text-muted)", padding: 0, marginBottom: "12px" }}>
            ← Back
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: meta.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{meta.emoji} {meta.title}</span>
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{qIdx + 1} / {questions.length}</span>
          </div>
          <div style={{ height: "6px", background: "var(--color-border)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${((qIdx + 1) / questions.length) * 100}%`, background: meta.color, borderRadius: "3px", transition: "width 0.3s ease" }} />
          </div>
        </div>

        {/* question */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "17px", fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.5, marginBottom: "24px" }}>
            {q.questionText}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {opts.map((opt: any, i: number) => {
              const selected = answers[q.id] === String(opt.value ?? opt.label ?? i);
              return (
                <button
                  key={i}
                  disabled={saving}
                  onClick={() => saveAnswer(q.id, String(opt.value ?? opt.label ?? i))}
                  style={{
                    padding: "14px 16px",
                    background: selected ? `${meta.color}12` : "var(--color-bg-secondary)",
                    border: `2px solid ${selected ? meta.color : "var(--color-border)"}`,
                    borderRadius: "12px",
                    cursor: saving ? "not-allowed" : "pointer",
                    textAlign: "left",
                    fontSize: "14px",
                    color: selected ? meta.color : "var(--color-text-primary)",
                    fontWeight: selected ? 600 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  {opt.label ?? opt.text ?? String(opt)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100svh - 200px)", textAlign: "center", gap: "16px" }}>
        <div style={{ fontSize: "56px" }}>🎉</div>
        <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)" }}>Assessment complete!</h2>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", maxWidth: "280px", lineHeight: 1.5 }}>
          Your results have been saved. Complete all 4 assessments to unlock your personalised career profile.
        </p>
        <button
          onClick={() => setActiveType(null)}
          style={{ padding: "12px 24px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
        >
          Back to assessments
        </button>
      </div>
    );
  }

  const completedCount = TYPES.filter((t) => getStatus(t) === "COMPLETED").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)" }}>Assessments</h1>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
          {completedCount === 4
            ? "All done! Your AI profile has been generated."
            : `${completedCount} of 4 complete — finish all 4 to unlock your career profile`}
        </p>
      </div>

      {completedCount === 4 && (
        <button
          onClick={() => apiClient.post("/learner/profile/generate").then(() => router.push("/learner/profile")).catch(() => {})}
          style={{ padding: "16px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
        >
          ✨ Generate my AI career profile
        </button>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {TYPES.map((type) => {
          const { color, emoji, title, desc, minutes } = META[type];
          const status = getStatus(type);
          const isCompleted = status === "COMPLETED";
          const inProgress  = status === "IN_PROGRESS";

          return (
            <div
              key={type}
              style={{
                background:   "var(--color-bg-secondary)",
                border:       `1px solid ${isCompleted ? color : "var(--color-border)"}`,
                borderRadius: "14px",
                padding:      "16px",
                position:     "relative",
                overflow:     "hidden",
              }}
            >
              {isCompleted && (
                <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "4px", background: color, borderRadius: "4px 0 0 4px" }} />
              )}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ fontSize: "28px", lineHeight: 1 }}>{emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</p>
                    {isCompleted
                      ? <span style={{ fontSize: "12px", color: "#22c55e", fontWeight: 600 }}>✓ Done</span>
                      : inProgress
                      ? <span style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 600 }}>In progress</span>
                      : <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>~{minutes} min</span>
                    }
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "4px", lineHeight: 1.4 }}>{desc}</p>
                  {!isCompleted && (
                    <button
                      onClick={() => inProgress ? resumeAssessment(type) : startAssessment(type)}
                      style={{
                        marginTop: "12px",
                        padding: "9px 20px",
                        background: color,
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {inProgress ? "Continue →" : "Start →"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
