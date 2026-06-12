"use client";

import { useState } from "react";
import { AdminActivityPage }      from "./ActivityPage";
import { AdminAgentActivityPage } from "./AgentActivityPage";
import { PageHeader } from "../components/AdminShell";

const TABS = [
  { key: "activity", label: "Activity Log",    sub: "All user actions across the platform" },
  { key: "agent",    label: "Agent Activity",  sub: "AI agent jobs, retries and outputs"   },
] as const;
type Tab = typeof TABS[number]["key"];

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--color-border)", marginBottom: 24 }}>
      {TABS.map((t) => {
        const on = t.key === active;
        return (
          <button key={t.key} onClick={() => onChange(t.key)} style={{
            padding: "10px 20px", fontSize: 13,
            fontWeight: on ? 700 : 500,
            color: on ? "var(--color-accent)" : "var(--color-text-muted)",
            background: "transparent", border: "none",
            borderBottom: on ? "2px solid var(--color-accent)" : "2px solid transparent",
            marginBottom: -1, cursor: "pointer", whiteSpace: "nowrap",
          }}>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export function AdminLogsPage() {
  const [tab, setTab] = useState<Tab>("activity");
  const sub = TABS.find((t) => t.key === tab)!.sub;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <PageHeader title="Logs" subtitle={sub} />
      <TabBar active={tab} onChange={setTab} />
      {tab === "activity" && <AdminActivityPage />}
      {tab === "agent"    && <AdminAgentActivityPage />}
    </div>
  );
}
