"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/shared/context/AuthContext";
import { BRAND } from "@/shared/config/branding.config";
import { roleHomeRoute } from "@/shared/config/roles.config";

const OAUTH_ERRORS: Record<string, string> = {
  google_denied: "Google sign-in was cancelled.",
  suspended:     "Your account has been suspended. Please contact support.",
  not_found:     "No account found. Please contact support.",
  oauth_failed:  "Google sign-in failed. Please try again.",
};

export default function LoginPage() {
  const router     = useRouter();
  const params     = useSearchParams();
  const { login, user, isLoading } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (!isLoading && user) router.push(roleHomeRoute(user.role));
  }, [user, isLoading, router]);

  useEffect(() => {
    const err = params.get("error");
    if (err && OAUTH_ERRORS[err]) setError(OAUTH_ERRORS[err]);
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#F8FAFC", padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>

        {/* Logo + heading */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: 22, fontWeight: 900, color: "#fff",
            boxShadow: "0 4px 14px rgba(91,79,207,0.25)",
          }}>
            {BRAND.logoMark}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 4, letterSpacing: "-0.02em" }}>
            {BRAND.name}
          </h1>
          <p style={{ fontSize: 13, color: "#64748B" }}>
            Staff portal — sign in to continue
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "#fff",
          border: "1px solid #E2E8F0",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        }}>

          {error && (
            <div style={{
              padding: "10px 14px", marginBottom: 20,
              background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: 8, fontSize: 13, color: "#DC2626",
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Email */}
            <div>
              <label style={{
                display: "block", fontSize: 11, fontWeight: 700,
                color: "#64748B", marginBottom: 6,
                textTransform: "uppercase", letterSpacing: "0.07em",
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@youmatter.co.za"
                required
                style={{
                  width: "100%", padding: "11px 14px",
                  background: "#F8FAFC", border: "1px solid #E2E8F0",
                  borderRadius: 8, fontSize: 14, color: "#0F172A",
                  outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onFocus={(e) => { e.target.style.borderColor = "var(--color-accent)"; e.target.style.boxShadow = "0 0 0 3px rgba(91,79,207,0.1)"; }}
                onBlur={(e)  => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{
                  fontSize: 11, fontWeight: 700, color: "#64748B",
                  textTransform: "uppercase", letterSpacing: "0.07em",
                }}>
                  Password
                </label>
                <Link href="/forgot-password" style={{ fontSize: 12, color: "var(--color-accent)", textDecoration: "none", fontWeight: 500 }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  style={{
                    width: "100%", padding: "11px 52px 11px 14px",
                    background: "#F8FAFC", border: "1px solid #E2E8F0",
                    borderRadius: 8, fontSize: 14, color: "#0F172A",
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--color-accent)"; e.target.style.boxShadow = "0 0 0 3px rgba(91,79,207,0.1)"; }}
                  onBlur={(e)  => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 12, color: "#94A3B8", fontWeight: 600,
                  }}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "12px",
                background: loading ? "#94A3B8" : "var(--color-accent)",
                border: "none", borderRadius: 8,
                fontSize: 14, fontWeight: 700, color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "opacity 0.15s",
                marginTop: 4,
              }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#94A3B8" }}>
          For learner access, visit{" "}
          <Link href="/login" style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 600 }}>
            the learner portal →
          </Link>
        </p>
      </div>
    </div>
  );
}
