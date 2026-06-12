"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/shared/context/AuthContext";
import { Zap, Target, Star } from "lucide-react";

const ERRORS: Record<string, string> = {
  google_denied:  "Google sign-in was cancelled.",
  suspended:      "Your account has been suspended. Please contact support.",
  not_found:      "No account found. Please contact support.",
  oauth_failed:   "Google sign-in failed. Please try again.",
  staff_account:  "This email is registered as a staff account and cannot be used here.",
};

function LearnerLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth() as any;

  useEffect(() => {
    if (!isLoading && user) {
      router.push(user.role === "LEARNER" ? "/learner" : "/staff-login");
    }
  }, [user, isLoading, router]);

  const error    = searchParams.get("error");
  const errorMsg = error ? ERRORS[error] : null;

  const handleGoogle = () => {
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
    window.location.href = `${api}/auth/google`;
  };

  return (
    <div style={{ height: "100%", display: "flex", overflow: "hidden" }}>

      {/* ── Left hero panel (desktop only) ─────────────────────────────── */}
      <div className="ym-hero" style={{
        display: "none", width: "50%", position: "relative",
        flexDirection: "column", justifyContent: "flex-end",
        background: "linear-gradient(160deg, #2D2480 0%, #5B4FCF 55%, #7C6EE8 100%)",
        overflow: "hidden",
      }}>
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: 48, left: 48, width: 128, height: 128, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
        <div style={{ position: "absolute", top: 128, right: 64, width: 80, height: 80, borderRadius: "50%", background: "#F97066", opacity: 0.2 }} />

        {/* Floating cards */}
        <div style={{ position: "absolute", top: 96, right: 40, background: "white", borderRadius: 16, padding: "12px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#EEE9FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Target size={15} color="#5B4FCF" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.8rem", color: "#1A1535", margin: 0 }}>Top Match</p>
              <p style={{ fontSize: "0.68rem", color: "#7A7499", margin: 0 }}>Software Engineer</p>
            </div>
            <span style={{ marginLeft: 8, fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "#D1FAE5", color: "#065F46" }}>92%</span>
          </div>
        </div>

        <div style={{ position: "absolute", top: 200, left: 40, background: "white", borderRadius: 16, padding: "12px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={15} color="#F97066" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.8rem", color: "#1A1535", margin: 0 }}>Bursary Found</p>
              <p style={{ fontSize: "0.68rem", color: "#7A7499", margin: 0 }}>Investec — R80,000/yr</p>
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: "35%", right: 24, background: "white", borderRadius: 16, padding: "10px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex" }}>
              {["#5B4FCF", "#0D9488", "#F97066"].map((c, i) => (
                <div key={i} style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: "2px solid white", marginLeft: i > 0 ? -6 : 0 }} />
              ))}
            </div>
            <p style={{ fontSize: "0.7rem", color: "#7A7499", margin: 0 }}>+2,400 learners joined</p>
          </div>
        </div>

        {/* Background photo */}
        <div style={{ position: "absolute", inset: 0 }}>
          <img
            src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=720&h=900&fit=crop&auto=format&q=80"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%", mixBlendMode: "luminosity", opacity: 0.35 }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(30,24,117,0.92) 30%, transparent 65%)" }} />
        </div>

        {/* Bottom quote */}
        <div style={{ position: "relative", zIndex: 10, padding: "0 40px 52px" }}>
          <div style={{ display: "flex", gap: 3, marginBottom: 12 }}>
            {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="#F59E0B" color="#F59E0B" />)}
          </div>
          <p style={{ color: "white", fontWeight: 700, fontSize: "1.15rem", lineHeight: 1.45, marginBottom: 8 }}>
            "You Matter helped me find my path<br />to becoming a doctor."
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>— Amahle, Grade 12, KwaZulu-Natal</p>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#FAFAF9", overflow: "hidden" }}>

        {/* Top bar: logo + back */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", padding: "20px 32px", flexShrink: 0 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#5B4FCF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={16} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#5B4FCF" }}>You Matter</span>
          </a>
        </div>

        {/* Centred form */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 32px 48px" }}>
          <div style={{ width: "100%", maxWidth: 340 }}>

            {/* Heading */}
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <h1 style={{ fontWeight: 800, fontSize: "2rem", color: "#1A1535", lineHeight: 1.2, letterSpacing: "-0.02em", margin: "0 0 10px" }}>
                Your future<br />starts here
              </h1>
              <p style={{ color: "#7A7499", fontSize: "0.95rem", margin: 0 }}>Discover careers made for you</p>
            </div>

            {/* Error */}
            {errorMsg && (
              <div style={{ marginBottom: 20, padding: "12px 16px", background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, fontSize: "0.85rem", color: "#DC2626", textAlign: "center" }}>
                {errorMsg}
              </div>
            )}

            {/* Google button */}
            <button
              onClick={handleGoogle}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                padding: "14px 20px", borderRadius: 12,
                border: "1.5px solid #DADCE0", cursor: "pointer",
                background: "white", color: "#3C4043",
                fontWeight: 600, fontSize: "0.95rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                transition: "box-shadow 0.15s, background 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.14)"; e.currentTarget.style.background = "#F8FAFF"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)"; e.currentTarget.style.background = "white"; }}
            >
              {/* Official Google G */}
              <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Continue with Google
            </button>

            <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.72rem", color: "#7A7499", lineHeight: 1.6 }}>
              By continuing, you agree to our{" "}
              <span style={{ textDecoration: "underline", cursor: "pointer", color: "#5B4FCF" }}>Terms</span>{" "}
              and{" "}
              <span style={{ textDecoration: "underline", cursor: "pointer", color: "#5B4FCF" }}>Privacy Policy</span>
            </p>

          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .ym-hero { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

export default function LearnerLoginPage() {
  return (
    <Suspense fallback={<div style={{ height: "100svh", background: "#FAFAF9" }} />}>
      <LearnerLoginInner />
    </Suspense>
  );
}
