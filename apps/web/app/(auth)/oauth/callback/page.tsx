"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import apiClient from "@/api/client";

function OAuthCallbackInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const to    = searchParams.get("to") ?? "/";

    if (!token) {
      window.location.href = "/login?error=oauth_failed";
      return;
    }

    // Store token first so apiClient can use it
    localStorage.setItem("auth_token", token);

    // For learners, check if onboarding is needed (grade not set)
    if (to === "/learner") {
      apiClient.get("/users/me")
        .then((res) => {
          const user = res.data?.data?.user;
          if (user?.grade == null) {
            window.location.href = "/learner/onboarding";
          } else {
            window.location.href = "/learner";
          }
        })
        .catch(() => {
          // If profile fetch fails just go to dashboard
          window.location.href = "/learner";
        });
    } else {
      window.location.href = to;
    }
  }, [searchParams]);

  return (
    <div style={{
      minHeight: "100svh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#FAFAF9",
    }}>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "3px solid rgba(91,79,207,0.15)",
          borderTopColor: "#5B4FCF",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: 14, color: "#7A7499", margin: 0 }}>Signing you in…</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100svh", background: "#FAFAF9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#7A7499", fontSize: 14 }}>Signing you in…</p>
      </div>
    }>
      <OAuthCallbackInner />
    </Suspense>
  );
}
