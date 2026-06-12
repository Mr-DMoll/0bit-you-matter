"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import apiClient from "@/api/client";
import { Download } from "lucide-react";
import { PageHeader, Card, StatCard, Spinner, Empty } from "../components/AdminShell";

// Must be dynamic — @react-pdf/renderer cannot run on the server
const AnalyticsExportButton = dynamic(
  () => import("../components/AnalyticsExportButton").then((m) => m.AnalyticsExportButton),
  { ssr: false, loading: () => (
    <button disabled style={{
      display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
      background: "var(--color-accent-subtle)", border: "none", borderRadius: "var(--radius-md)",
      fontSize: 13, fontWeight: 700, color: "var(--color-accent)", cursor: "not-allowed", opacity: 0.6,
    }}>
      <Download size={15} />
      Export PDF
    </button>
  )},
);

const TABS = [
  { key: "learners", label: "Learner Insights" },
  { key: "content",  label: "Content Analytics" },
  { key: "growth",   label: "Platform Growth" },
] as const;

type Tab = typeof TABS[number]["key"];

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--color-border)", marginBottom: 24 }}>
      {TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            style={{
              padding: "10px 20px",
              fontSize: 13, fontWeight: isActive ? 700 : 500,
              color: isActive ? "var(--color-accent)" : "var(--color-text-muted)",
              background: "transparent",
              border: "none",
              borderBottom: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
              marginBottom: -1,
              cursor: "pointer",
              transition: "color 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Bar row helper ────────────────────────────────────────────────────────────
function BarRow({ label, value, max, color, suffix = "" }: {
  label: string; value: number; max: number; color: string; suffix?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{label}</span>
        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
          {value}{suffix} {max > 0 && <span style={{ opacity: 0.5 }}>({pct}%)</span>}
        </span>
      </div>
      <div style={{ height: 6, background: "var(--color-border)", borderRadius: 3 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.5s" }} />
      </div>
    </div>
  );
}

// ── Ranked list ───────────────────────────────────────────────────────────────
function RankedList({ items }: { items: { title: string; count: number }[] }) {
  if (!items.length) return <Empty message="No data yet." />;
  const max = items[0]?.count ?? 1;
  return (
    <div>
      {items.map((item, i) => (
        <div key={item.title} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{
            width: 22, height: 22, borderRadius: "50%", background: "var(--color-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", flexShrink: 0,
          }}>{i + 1}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{item.title}</span>
              <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{item.count}</span>
            </div>
            <div style={{ height: 4, background: "var(--color-border)", borderRadius: 2 }}>
              <div style={{ height: "100%", width: `${Math.round((item.count / max) * 100)}%`, background: "var(--color-accent)", borderRadius: 2 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Learner Insights ──────────────────────────────────────────────────────────
function LearnerInsights({ d }: { d: any }) {
  const li = d?.learnerInsights ?? {};
  const assessments: { type: string; completed: number; total: number }[] = li.assessmentCompletion ?? [];
  const provinces: { province: string | null; count: number }[] = li.provinceDistribution ?? [];
  const maxProv = Math.max(1, ...provinces.map((p) => p.count));

  const COLORS: Record<string, string> = {
    INTEREST: "#5B4FCF", APTITUDE: "#2563EB", PERSONALITY: "#7C3AED", VALUES: "#D97706",
  };
  const LABELS: Record<string, string> = {
    INTEREST: "Interest", APTITUDE: "Aptitude", PERSONALITY: "Personality", VALUES: "Values",
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Learners"     value={li.totalLearners    ?? 0} color="#5B4FCF" icon="🎓" />
        <StatCard label="Active This Week"   value={li.activeThisWeek   ?? 0} color="#0D9488" icon="🔥" />
        <StatCard label="Profiles Generated" value={li.profilesGenerated ?? 0} color="#7C3AED" icon="✨" />
        <StatCard label="Provinces Covered"  value={provinces.length}         color="#2563EB" icon="🗺️" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card title="Assessment Completion">
          {assessments.length === 0
            ? <Empty message="No assessments started yet." />
            : assessments.map(({ type, completed, total }) => (
              <BarRow
                key={type}
                label={LABELS[type] ?? type}
                value={completed}
                max={Math.max(1, total)}
                color={COLORS[type] ?? "#94A3B8"}
                suffix={` / ${total}`}
              />
            ))
          }
        </Card>

        <Card title="Province Distribution">
          {provinces.length === 0
            ? <Empty message="Province data will populate once learners complete their profiles." />
            : provinces.slice(0, 9).map(({ province, count }) => (
              <BarRow
                key={province ?? "Unknown"}
                label={province ?? "Not set"}
                value={count}
                max={maxProv}
                color="#5B4FCF"
              />
            ))
          }
        </Card>
      </div>

      <Card title="Most Explored Careers (by match)">
        <RankedList items={(d?.contentAnalytics?.topMatchedCareers ?? []).map((c: any) => ({ title: c.title, count: c.count }))} />
      </Card>
    </>
  );
}

// ── Content Analytics ─────────────────────────────────────────────────────────
function ContentAnalytics({ d }: { d: any }) {
  const ca = d?.contentAnalytics ?? {};

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Careers"       value={ca.totalCareers      ?? 0} color="#5B4FCF" icon="💼" />
        <StatCard label="AI Generations Done" value={ca.completedJobs     ?? 0} color="#059669" icon="🤖" />
        <StatCard label="Chat Messages"       value={ca.totalChatMessages ?? 0} color="#7C3AED" icon="💬" />
        <StatCard label="Helpful Reactions"
          value={ca.thumbsUpCount ?? 0}
          sub={`👎 ${ca.thumbsDownCount ?? 0} not helpful`}
          color="#D97706"
          icon="👍"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card title="Most Matched Careers">
          <RankedList items={(ca.topMatchedCareers ?? []).map((c: any) => ({ title: c.title, count: c.count }))} />
        </Card>
        <Card title="Most Saved Careers">
          <RankedList items={(ca.topSavedCareers ?? []).map((c: any) => ({ title: c.title, count: c.count }))} />
        </Card>
      </div>

      <Card title="Chat Feedback Summary">
        {(ca.totalChatMessages ?? 0) === 0
          ? <Empty message="No chat messages yet." />
          : (() => {
              const total   = ca.totalChatMessages ?? 0;
              const up      = ca.thumbsUpCount     ?? 0;
              const down    = ca.thumbsDownCount   ?? 0;
              const reacted = up + down;
              return (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Total messages",   value: total,               pct: null,                      color: "#5B4FCF" },
                    { label: "Helpful (👍)",      value: up,                  pct: reacted ? Math.round(up   / reacted * 100) : null, color: "#059669" },
                    { label: "Not helpful (👎)",  value: down,                pct: reacted ? Math.round(down / reacted * 100) : null, color: "#DC2626" },
                  ].map(({ label, value, pct, color }) => (
                    <div key={label} style={{ padding: "12px 16px", background: "var(--color-surface-raised)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>{label}</div>
                      {pct !== null && <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2, opacity: 0.7 }}>{pct}% of rated</div>}
                    </div>
                  ))}
                </div>
              );
            })()
        }
      </Card>
    </>
  );
}

// ── Platform Growth ───────────────────────────────────────────────────────────
function PlatformGrowth({ d }: { d: any }) {
  const pg = d?.platformGrowth ?? {};
  const months: { month: string; count: number }[] = pg.registrationsByMonth ?? [];
  const maxCount = Math.max(1, ...months.map((m) => m.count));

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Learners"     value={pg.totalLearners     ?? 0} color="#5B4FCF" icon="🎓" />
        <StatCard label="Pending Invites"    value={pg.pendingInvites    ?? 0} color={(pg.pendingInvites ?? 0) > 0 ? "#D97706" : "#94A3B8"} icon="📨" />
        <StatCard label="Schools Covered"    value={pg.schoolsCovered    ?? 0} color="#2563EB" icon="🏫" />
        <StatCard label="Provinces Covered"  value={pg.provincesCovered  ?? 0} color="#0D9488" icon="🗺️" />
      </div>

      <Card title="Learner Registrations Over Time">
        {months.length === 0
          ? <Empty message="Registration data will populate as learners join." />
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {months.map(({ month, count }) => {
                const [year, mon] = month.split("-");
                const label = new Date(parseInt(year), parseInt(mon) - 1, 1)
                  .toLocaleString("en-ZA", { month: "short", year: "2-digit" });
                return (
                  <div key={month} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 50, fontSize: 12, color: "var(--color-text-muted)", flexShrink: 0 }}>{label}</span>
                    <div style={{ flex: 1, height: 20, background: "var(--color-border)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${Math.round((count / maxCount) * 100)}%`,
                        background: "var(--color-accent)",
                        borderRadius: 3,
                        display: "flex", alignItems: "center", paddingLeft: 6,
                        transition: "width 0.5s",
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
                          {count > 0 ? count : ""}
                        </span>
                      </div>
                    </div>
                    <span style={{ width: 24, fontSize: 12, color: "var(--color-text-muted)", textAlign: "right", flexShrink: 0 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          )
        }
      </Card>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function AdminAnalyticsPage({ defaultTab }: { defaultTab?: Tab }) {
  const [tab,     setTab]     = useState<Tab>(defaultTab ?? "learners");
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    apiClient.get("/admin/analytics")
      .then((r) => setData(r.data.data))
      .catch(() => setError("Could not load analytics data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error)   return <p style={{ color: "var(--color-danger)", padding: 24 }}>{error}</p>;

  const subtitles: Record<Tab, string> = {
    learners: "Assessment completion, engagement and province distribution",
    content:  "Career views, AI generation stats and guidance chat feedback",
    growth:   "Registrations over time, province and school coverage",
  };

  const exportProps = data ? {
    generatedAt: new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" }),
    learnerInsights: {
      totalLearners:        data.learnerInsights?.totalLearners     ?? 0,
      activeThisWeek:       data.learnerInsights?.activeThisWeek    ?? 0,
      profilesGenerated:    data.learnerInsights?.profilesGenerated ?? 0,
      assessmentCompletion: data.learnerInsights?.assessmentCompletion ?? [],
      provinceDistribution: data.learnerInsights?.provinceDistribution ?? [],
      topMatchedCareers:    (data.contentAnalytics?.topMatchedCareers ?? []).map((c: any) => ({ title: c.title, count: c.count })),
    },
    contentAnalytics: {
      totalCareers:      data.contentAnalytics?.totalCareers      ?? 0,
      completedJobs:     data.contentAnalytics?.completedJobs     ?? 0,
      totalChatMessages: data.contentAnalytics?.totalChatMessages ?? 0,
      thumbsUpCount:     data.contentAnalytics?.thumbsUpCount     ?? 0,
      thumbsDownCount:   data.contentAnalytics?.thumbsDownCount   ?? 0,
      topMatchedCareers: (data.contentAnalytics?.topMatchedCareers ?? []).map((c: any) => ({ title: c.title, count: c.count })),
      topSavedCareers:   (data.contentAnalytics?.topSavedCareers   ?? []).map((c: any) => ({ title: c.title, count: c.count })),
    },
    platformGrowth: {
      totalLearners:        data.platformGrowth?.totalLearners        ?? 0,
      pendingInvites:       data.platformGrowth?.pendingInvites       ?? 0,
      schoolsCovered:       data.platformGrowth?.schoolsCovered       ?? 0,
      provincesCovered:     data.platformGrowth?.provincesCovered     ?? 0,
      registrationsByMonth: data.platformGrowth?.registrationsByMonth ?? [],
    },
  } : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <PageHeader
        title="Analytics"
        subtitle={subtitles[tab]}
        action={exportProps ? <AnalyticsExportButton {...exportProps} /> : undefined}
      />
      <TabBar active={tab} onChange={setTab} />

      {tab === "learners" && <LearnerInsights  d={data} />}
      {tab === "content"  && <ContentAnalytics d={data} />}
      {tab === "growth"   && <PlatformGrowth   d={data} />}
    </div>
  );
}
