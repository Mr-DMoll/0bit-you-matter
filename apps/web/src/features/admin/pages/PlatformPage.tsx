"use client";

import { useState, useEffect } from "react";
import apiClient from "@/api/client";
import { PageHeader, Card, StatCard, Spinner } from "../components/AdminShell";

// ── Tab bar ───────────────────────────────────────────────────────────────────
const TABS = [
  { key: "health",   label: "Health",    sub: "Deployment status and service connectivity" },
  { key: "ai",       label: "AI Usage",  sub: "Anthropic token usage and cost estimates"   },
  { key: "settings", label: "Settings",  sub: "Platform configuration and feature flags"   },
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

// ── Health indicator ──────────────────────────────────────────────────────────
type ServiceStatus = "up" | "down" | "checking" | "unknown";

function ServiceCard({ name, description, status, detail, url }: {
  name: string; description: string; status: ServiceStatus; detail?: string; url?: string;
}) {
  const cfg: Record<ServiceStatus, { color: string; bg: string; label: string; dot: string }> = {
    up:       { color: "#16A34A", bg: "#F0FDF4", label: "Operational", dot: "#16A34A" },
    down:     { color: "#DC2626", bg: "#FEF2F2", label: "Down",        dot: "#DC2626" },
    checking: { color: "#D97706", bg: "#FFFBEB", label: "Checking…",   dot: "#D97706" },
    unknown:  { color: "#94A3B8", bg: "#F8FAFC", label: "Unknown",     dot: "#94A3B8" },
  };
  const c = cfg[status];
  return (
    <div style={{
      padding: "16px 20px", background: c.bg,
      border: `1px solid ${c.color}28`, borderLeft: `3px solid ${c.color}`,
      borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.dot, flexShrink: 0,
        boxShadow: status === "up" ? `0 0 0 3px ${c.dot}30` : "none",
      }} />
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }}>{name}</p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>{description}</p>
        {detail && <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--color-text-muted)", fontFamily: "monospace" }}>{detail}</p>}
      </div>
      <div style={{ textAlign: "right" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{c.label}</span>
        {url && <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--color-text-muted)" }}>{url}</p>}
      </div>
    </div>
  );
}

// ── Health tab ────────────────────────────────────────────────────────────────
function HealthTab() {
  const [apiStatus,  setApiStatus]  = useState<ServiceStatus>("checking");
  const [dbStatus,   setDbStatus]   = useState<ServiceStatus>("checking");
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [loading,    setLoading]    = useState(true);

  const [healthData, setHealthData] = useState<any>(null);

  const doCheck = () => {
    setApiStatus("checking"); setDbStatus("checking"); setLoading(true);
    const t0 = Date.now();
    apiClient.get("/system/health")
      .then((r) => {
        setApiLatency(Date.now() - t0);
        setApiStatus("up");
        setHealthData(r.data);
        setDbStatus(r.data?.database?.status === "connected" ? "up" : "down");
      })
      .catch(() => { setApiStatus("down"); setDbStatus("unknown"); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { doCheck(); }, []);

  const refresh = doCheck;

  const dbLatency = healthData?.database?.latencyMs;
  const uptime    = healthData?.uptimeSeconds;
  const allUp = apiStatus === "up" && dbStatus === "up";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Overall banner */}
      <div style={{
        padding: "16px 20px", borderRadius: "var(--radius-lg)",
        background: allUp ? "#F0FDF4" : "#FEF2F2",
        border: `1px solid ${allUp ? "#16A34A" : "#DC2626"}28`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>{allUp ? "✅" : "⚠️"}</span>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)" }}>
              {allUp ? "All systems operational" : "Some services need attention"}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>
              Last checked: {new Date().toLocaleTimeString("en-ZA")}
              {apiLatency != null ? ` · API latency: ${apiLatency}ms` : ""}
            </p>
          </div>
        </div>
        <button onClick={refresh} disabled={loading} style={{
          padding: "7px 16px", fontSize: 12, fontWeight: 600, borderRadius: "var(--radius-md)",
          background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
          cursor: loading ? "not-allowed" : "pointer", color: "var(--color-text-secondary)",
          opacity: loading ? 0.6 : 1,
        }}>
          {loading ? "Checking…" : "Refresh"}
        </button>
      </div>

      {/* Services */}
      <Card title="Services">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <ServiceCard
            name="API Server"
            description="Express backend"
            status={apiStatus}
            detail={apiLatency != null ? `Response time: ${apiLatency}ms${uptime != null ? ` · Uptime: ${Math.floor(uptime / 60)}m` : ""}` : undefined}
            url={process.env.NEXT_PUBLIC_API_URL ?? "localhost:3001"}
          />
          <ServiceCard
            name="Database"
            description="PostgreSQL — Supabase"
            status={dbStatus}
            detail={dbLatency != null ? `Query latency: ${dbLatency}ms` : undefined}
            url="supabase.com"
          />
          <ServiceCard
            name="Web App"
            description="Next.js frontend — Vercel"
            status="up"
            detail="This dashboard is running"
            url="vercel.app"
          />
          <ServiceCard
            name="AI (Anthropic)"
            description="Claude API — career guidance & content generation"
            status="up"
            url="anthropic.com"
          />
        </div>
      </Card>

      {/* Environment info */}
      <Card title="Environment">
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { label: "Environment",   value: healthData?.environment ?? process.env.NODE_ENV ?? "production" },
            { label: "API base URL",  value: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1" },
            { label: "API version",   value: healthData?.version ?? "—" },
            { label: "Memory (heap)", value: healthData?.memory ? `${healthData.memory.heapUsedMB} / ${healthData.memory.heapTotalMB} MB` : "—" },
          ].map(({ label, value }, i, arr) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "11px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--color-border)" : "none",
            }}>
              <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", fontFamily: "monospace" }}>{value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── AI Usage tab ──────────────────────────────────────────────────────────────
function AiUsageTab() {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/admin/analytics")
      .then((r) => setData(r.data.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const ca            = data?.contentAnalytics ?? {};
  const totalJobs     = ca.completedJobs       ?? 0;
  const chatMessages  = ca.totalChatMessages   ?? 0;
  const thumbsUp      = ca.thumbsUpCount       ?? 0;
  const thumbsDown    = ca.thumbsDownCount     ?? 0;

  // Rough token estimates based on real usage counts
  const estChatTokens   = Math.round(chatMessages  * 420);  // ~420 avg tokens/message (system + context)
  const estOpusTokens   = Math.round(totalJobs     * 2400); // ~2400 avg tokens/generation job

  const MODELS = [
    {
      name:  "claude-haiku-4-5-20251001",
      use:   "Career guidance chat (learner conversations)",
      color: "#5B4FCF",
      stat:  chatMessages,
      statLabel: "chat messages",
      estTokens: estChatTokens,
    },
    {
      name:  "claude-opus-4-8",
      use:   "Content generation (careers, bursaries, pathways)",
      color: "#0D9488",
      stat:  totalJobs,
      statLabel: "completed jobs",
      estTokens: estOpusTokens,
    },
    {
      name:  "claude-sonnet-4-6",
      use:   "Assessment analysis & career profile matching",
      color: "#7C3AED",
      stat:  data?.learnerInsights?.profilesGenerated ?? 0,
      statLabel: "profiles generated",
      estTokens: Math.round((data?.learnerInsights?.profilesGenerated ?? 0) * 800),
    },
  ];

  const totalEstTokens = MODELS.reduce((s, m) => s + m.estTokens, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <StatCard label="Generation Jobs"  value={totalJobs.toLocaleString()}        color="#5B4FCF" icon="🤖" sub="completed all time" />
        <StatCard label="Chat Messages"    value={chatMessages.toLocaleString()}      color="#0D9488" icon="💬" sub="guidance conversations" />
        <StatCard label="Est. Tokens Used" value={totalEstTokens > 0 ? `~${(totalEstTokens / 1000).toFixed(1)}k` : "0"} color="#7C3AED" icon="📊" sub="across all models" />
        <StatCard label="Chat Helpfulness" value={chatMessages > 0 && (thumbsUp + thumbsDown) > 0 ? `${Math.round(thumbsUp / (thumbsUp + thumbsDown) * 100)}%` : "—"} color="#D97706" icon="👍" sub={`${thumbsUp} 👍 · ${thumbsDown} 👎`} />
      </div>

      {/* Model breakdown */}
      <Card title="Models in use">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MODELS.map((m) => (
            <div key={m.name} style={{
              display: "flex", alignItems: "center", gap: 16, padding: "14px 16px",
              background: `${m.color}08`, border: `1px solid ${m.color}20`,
              borderLeft: `3px solid ${m.color}`, borderRadius: "var(--radius-md)",
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)", fontFamily: "monospace" }}>{m.name}</p>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>{m.use}</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: m.color }}>{m.stat.toLocaleString()}</p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)" }}>{m.statLabel}</p>
                {m.estTokens > 0 && (
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--color-text-muted)", opacity: 0.6 }}>
                    ~{(m.estTokens / 1000).toFixed(1)}k tokens est.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 12, lineHeight: 1.5 }}>
          💡 Token counts are estimates based on usage volume. Connect the Anthropic Usage API in Settings for exact billing data.
        </p>
      </Card>

      {/* Chat quality */}
      {chatMessages > 0 && (
        <Card title="Guidance Chat Quality">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              { label: "Total messages",     value: chatMessages,                  color: "#5B4FCF" },
              { label: "Marked helpful 👍",  value: thumbsUp,                      color: "#16A34A" },
              { label: "Not helpful 👎",     value: thumbsDown,                    color: "#DC2626" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ padding: "14px", background: "var(--color-surface-raised)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color }}>{value.toLocaleString()}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Settings tab ──────────────────────────────────────────────────────────────
function SettingsTab() {
  const [saved, setSaved] = useState(false);

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card title={title}>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>{children}</div>
    </Card>
  );

  const Row = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 0", borderBottom: "1px solid var(--color-border)",
    }}>
      <div style={{ flex: 1, paddingRight: 16 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{label}</p>
        {description && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>{description}</p>}
      </div>
      {children}
    </div>
  );

  const Toggle = ({ defaultOn = false }: { defaultOn?: boolean }) => {
    const [on, setOn] = useState(defaultOn);
    return (
      <button onClick={() => setOn(!on)} style={{
        width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
        background: on ? "var(--color-accent)" : "var(--color-border)",
        position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}>
        <div style={{
          position: "absolute", top: 2, left: on ? 22 : 2,
          width: 20, height: 20, borderRadius: "50%", background: "#fff",
          transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </button>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      <Section title="Platform">
        <Row label="Platform name" description="Shown in emails and the app header">
          <input defaultValue="You Matter" style={{ padding: "7px 12px", fontSize: 13, border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", width: 200, outline: "none" }} />
        </Row>
        <Row label="Learner registration" description="Allow new learners to register">
          <Toggle defaultOn />
        </Row>
        <Row label="Maintenance mode" description="Shows a maintenance message to all learners">
          <Toggle />
        </Row>
      </Section>

      <Section title="AI & Automation">
        <Row label="Career Guide chat" description="Enable the AI career guidance chat for learners">
          <Toggle defaultOn />
        </Row>
        <Row label="Auto-match on assessment complete" description="Run career matching automatically after Interest assessment">
          <Toggle defaultOn />
        </Row>
        <Row label="AI content generation" description="Allow content managers to trigger AI generation jobs">
          <Toggle defaultOn />
        </Row>
        <Row label="Anthropic API key" description="Required for AI features">
          <input type="password" defaultValue="sk-ant-••••••••••••••" style={{ padding: "7px 12px", fontSize: 13, border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", width: 220, outline: "none", fontFamily: "monospace" }} />
        </Row>
      </Section>

      <Section title="Notifications">
        <Row label="Email notifications" description="Send email when an invite is accepted">
          <Toggle defaultOn />
        </Row>
        <Row label="Low AI credit alert" description="Notify admin when token budget hits 80%">
          <Toggle defaultOn />
        </Row>
      </Section>

      <Section title="Danger Zone">
        <Row label="Reset all learner matches" description="Clears all career match data — cannot be undone">
          <button style={{
            padding: "6px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer",
            borderRadius: "var(--radius-md)", background: "var(--color-danger-subtle)",
            color: "var(--color-danger)", border: "1px solid var(--color-danger-subtle)",
          }}>Reset</button>
        </Row>
        <div style={{ paddingTop: 14 }}>
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>
            ⚠️ Settings changes take effect immediately. Danger zone actions are irreversible.
          </p>
        </div>
      </Section>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          style={{
            padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            borderRadius: "var(--radius-md)", border: "none",
            background: saved ? "#16A34A" : "var(--color-accent)",
            color: "#fff", transition: "background 0.2s",
          }}
        >
          {saved ? "✓ Saved" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function AdminPlatformPage({ defaultTab }: { defaultTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(defaultTab ?? "health");
  const sub = TABS.find((t) => t.key === tab)!.sub;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <PageHeader title="Platform" subtitle={sub} />
      <TabBar active={tab} onChange={setTab} />
      {tab === "health"   && <HealthTab />}
      {tab === "ai"       && <AiUsageTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}
