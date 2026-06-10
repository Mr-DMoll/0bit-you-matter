"use client";

import { PageHeader, Card, Badge } from "@/features/admin/components/AdminShell";

type UpdateItem = {
  dataType: string;
  frequency: string;
  nextDue: string;
  owner: string;
  status: "On track" | "Due soon" | "Overdue";
};

const SCHEDULE: UpdateItem[] = [
  { dataType: "Career profiles",        frequency: "Annual",       nextDue: "Jan 2026",  owner: "Content Manager", status: "On track" },
  { dataType: "University APS data",    frequency: "Annual",       nextDue: "Oct 2025",  owner: "Data Verifier",   status: "Due soon" },
  { dataType: "Bursary deadlines",      frequency: "Per cycle",    nextDue: "Aug 2025",  owner: "Data Verifier",   status: "On track" },
  { dataType: "Salary ranges",          frequency: "Annual",       nextDue: "Mar 2026",  owner: "Content Manager", status: "On track" },
  { dataType: "RIASEC question bank",   frequency: "Bi-annual",    nextDue: "Nov 2025",  owner: "Content Manager", status: "On track" },
  { dataType: "Career cluster taxonomy",frequency: "As needed",    nextDue: "Ongoing",   owner: "Admin",           status: "On track" },
  { dataType: "Programme fees",         frequency: "Annual",       nextDue: "Jan 2026",  owner: "Data Verifier",   status: "On track" },
  { dataType: "Source URLs",            frequency: "Quarterly",    nextDue: "Sep 2025",  owner: "Content Manager", status: "Due soon" },
];

const STATUS_COLOR: Record<string, string> = {
  "On track": "#22c55e",
  "Due soon":  "#f59e0b",
  "Overdue":   "#ef4444",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function CMUpdatePlannerPage() {
  const now = new Date();
  const currentMonth = now.getMonth();

  const calendarItems: Record<number, string[]> = {};
  SCHEDULE.forEach((item) => {
    const parts = item.nextDue.split(" ");
    if (parts.length === 2) {
      const idx = MONTHS.indexOf(parts[0]);
      if (idx >= 0) {
        calendarItems[idx] = [...(calendarItems[idx] ?? []), item.dataType];
      }
    }
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Update Planner"
        subtitle="Annual data refresh calendar — track when each data type needs to be regenerated or verified"
      />

      <Card title="Annual refresh calendar">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {MONTHS.map((month, idx) => {
            const items = calendarItems[idx] ?? [];
            const isCurrent = idx === currentMonth;
            return (
              <div key={month} style={{
                padding: "12px",
                background: isCurrent ? "rgba(99,102,241,0.06)" : "var(--color-bg-secondary)",
                border: `1px solid ${isCurrent ? "#6366f1" : "var(--color-border)"}`,
                borderRadius: "var(--radius-md)",
              }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: isCurrent ? "#6366f1" : "var(--color-text-muted)", marginBottom: "6px" }}>
                  {month} {isCurrent && "← now"}
                </p>
                {items.length === 0 ? (
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>—</p>
                ) : items.map((item) => (
                  <div key={item} style={{ fontSize: "11px", color: "var(--color-text-secondary)", padding: "2px 0", borderBottom: "1px solid var(--color-border)", marginBottom: "2px" }}>
                    {item}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Update schedule">
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
            {["Data type", "Frequency", "Next due", "Owner", "Status"].map((h) => (
              <span key={h} style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</span>
            ))}
          </div>
          {SCHEDULE.map((item) => (
            <div key={item.dataType} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "10px 0", borderBottom: "1px solid var(--color-border)", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)" }}>{item.dataType}</span>
              <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{item.frequency}</span>
              <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{item.nextDue}</span>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{item.owner}</span>
              <Badge label={item.status} color={STATUS_COLOR[item.status]} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="How the refresh process works">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            { num: "1", color: "#6366f1", title: "Identify stale content", desc: "Use the Freshness Dashboard to find data types past their update threshold." },
            { num: "2", color: "#3b82f6", title: "Trigger regeneration",  desc: "Queue a generation job for each stale content type from the Generate Content page." },
            { num: "3", color: "#8b5cf6", title: "Assign for review",     desc: "Route AI-generated updates to a Professional Reviewer via Assign Reviews." },
            { num: "4", color: "#f59e0b", title: "Verify against sources",desc: "Data Verifiers cross-check updated facts against the official sources in the Source Library." },
            { num: "5", color: "#22c55e", title: "Publish",               desc: "Verified content is marked VERIFIED and becomes visible to learners immediately." },
          ].map(({ num, color, title, desc }) => (
            <div key={num} style={{ display: "flex", gap: "12px" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{num}</div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{title}</p>
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
