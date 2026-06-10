"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SidebarClient from "./SidebarClient";
import TopNav from "./TopNav";
import { useAuth } from "@/shared/context/AuthContext";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  // While checking auth — show nothing (avoids flash of dashboard)
  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--color-bg)" }}>
        <div style={{ width: "32px", height: "32px", border: "3px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not authenticated — redirect is in progress, render nothing
  if (!user) return null;

  return (
    <div style={{
      display:         "flex",
      height:          "100vh",
      overflow:        "hidden",
      backgroundColor: "var(--color-bg)",
    }}>
      {/* LEFT COLUMN — sidebar owns full height */}
      <SidebarClient
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
      />

      {/* RIGHT COLUMN — top nav + scrollable content */}
      <div style={{
        flex:          1,
        display:       "flex",
        flexDirection: "column",
        overflow:      "hidden",
        minWidth:      0,
      }}>
        <TopNav />
        <main style={{
          flex:      1,
          overflowY: "auto",
          padding:   "28px 32px",
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
