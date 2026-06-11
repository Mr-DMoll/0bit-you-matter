"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/context/AuthContext";
import { Sparkles, GraduationCap, MapPin, ChevronRight } from "lucide-react";
import apiClient from "@/api/client";

const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
  "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape",
];

const GRADES = [
  { value: 8,  label: "Grade 8"  },
  { value: 9,  label: "Grade 9"  },
  { value: 10, label: "Grade 10" },
  { value: 11, label: "Grade 11" },
  { value: 12, label: "Grade 12" },
];

const T = {
  primary:   "#5B4FCF",
  secondary: "#EEE9FF",
  coral:     "#F97066",
  bg:        "#FAFAF9",
  card:      "#FFFFFF",
  fg:        "#1A1535",
  muted:     "#7A7499",
  border:    "rgba(91,79,207,0.12)",
};

export default function LearnerOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth() as any;

  const [grade,    setGrade]    = useState<number | null>(null);
  const [province, setProvince] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const firstName = user?.firstName ?? user?.displayName?.split(" ")[0] ?? "there";
  const canContinue = grade !== null && province !== "";

  const handleContinue = async () => {
    if (!canContinue) return;
    setSaving(true);
    setError("");
    try {
      await apiClient.patch("/users/me", { grade, province });
      router.push("/learner");
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  const handleSkip = () => router.push("/learner");

  return (
    <div style={{
      minHeight: "100svh", background: T.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
    }}>
      <div style={{ width: "100%", maxWidth: 460 }}>

        {/* Icon */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, background: T.primary,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(91,79,207,0.3)",
          }}>
            <Sparkles size={28} color="white" />
          </div>
        </div>

        {/* Welcome heading */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h1 style={{
            fontWeight: 800, fontSize: "1.9rem", color: T.fg,
            lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 10,
          }}>
            Welcome, {firstName}! 🎉
          </h1>
          <p style={{ color: T.muted, fontSize: "1rem", lineHeight: 1.6 }}>
            Two quick questions and we'll personalise<br />
            your career paths and bursaries for you.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>

          {/* Grade */}
          <div style={{
            background: T.card, borderRadius: 18, padding: "18px 20px",
            border: `1.5px solid ${grade ? T.primary : T.border}`,
            boxShadow: grade ? "0 0 0 4px rgba(91,79,207,0.08)" : "none",
            transition: "all 0.15s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: T.secondary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <GraduationCap size={20} color={T.primary} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  What grade are you in?
                </label>
                <select
                  value={grade ?? ""}
                  onChange={e => setGrade(e.target.value ? parseInt(e.target.value) : null)}
                  style={{
                    width: "100%", background: "transparent", border: "none",
                    outline: "none", fontSize: "1rem", fontWeight: 600,
                    color: grade ? T.fg : T.muted, cursor: "pointer",
                    appearance: "none",
                  }}
                >
                  <option value="">Select your grade</option>
                  {GRADES.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Province */}
          <div style={{
            background: T.card, borderRadius: 18, padding: "18px 20px",
            border: `1.5px solid ${province ? T.primary : T.border}`,
            boxShadow: province ? "0 0 0 4px rgba(91,79,207,0.08)" : "none",
            transition: "all 0.15s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: T.secondary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MapPin size={20} color={T.primary} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  Which province are you in?
                </label>
                <select
                  value={province}
                  onChange={e => setProvince(e.target.value)}
                  style={{
                    width: "100%", background: "transparent", border: "none",
                    outline: "none", fontSize: "1rem", fontWeight: 600,
                    color: province ? T.fg : T.muted, cursor: "pointer",
                    appearance: "none",
                  }}
                >
                  <option value="">Select your province</option>
                  {PROVINCES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* What you unlock */}
        {(grade || province) && (
          <div style={{
            background: T.secondary, borderRadius: 14, padding: "14px 18px",
            marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: "1.2rem" }}>✨</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.85rem", color: T.primary, marginBottom: 3 }}>
                Here's what we'll personalise for you
              </p>
              <p style={{ fontSize: "0.8rem", color: T.muted, lineHeight: 1.5 }}>
                {grade && grade <= 11
                  ? "Career paths and the subjects you need to get there."
                  : grade === 12
                  ? "Application timelines, bursaries and university requirements."
                  : "Career paths and bursaries relevant to you."}
                {province ? ` Bursaries available in ${province}.` : ""}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p style={{ color: "#DC2626", fontSize: "0.82rem", textAlign: "center", marginBottom: 14 }}>{error}</p>
        )}

        {/* CTA */}
        <button
          onClick={handleContinue}
          disabled={!canContinue || saving}
          style={{
            width: "100%", padding: "15px", borderRadius: 16, border: "none",
            background: canContinue ? T.primary : "#D1D5DB",
            color: canContinue ? "white" : "#9CA3AF",
            fontWeight: 700, fontSize: "1rem", cursor: canContinue ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: canContinue ? "0 4px 16px rgba(91,79,207,0.3)" : "none",
            transition: "all 0.15s",
          }}
        >
          {saving ? "Saving…" : "Let's go"} {!saving && <ChevronRight size={18} />}
        </button>

        {/* Skip */}
        <button
          onClick={handleSkip}
          style={{
            width: "100%", marginTop: 14, padding: "10px",
            background: "transparent", border: "none",
            color: T.muted, fontSize: "0.78rem", cursor: "pointer",
          }}
        >
          I'll do this later
        </button>

      </div>
    </div>
  );
}
