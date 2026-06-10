"use client";

import { PageHeader, Card, Badge } from "../components/AdminShell";

const UPDATE_SCHEDULE = [
  { type: "APS Scores",            frequency: "Annual",    window: "Jan–Feb",  status: "Upcoming", priority: "High" },
  { type: "Application Deadlines", frequency: "Annual",    window: "Apr–May",  status: "Upcoming", priority: "High" },
  { type: "Bursary Deadlines",     frequency: "Annual",    window: "Mar–Apr",  status: "Upcoming", priority: "High" },
  { type: "NSFAS Eligibility",     frequency: "Annual",    window: "Feb–Mar",  status: "Upcoming", priority: "High" },
  { type: "Career Content",        frequency: "Quarterly", window: "Ongoing",  status: "Active",   priority: "Medium" },
  { type: "TVET Programmes",       frequency: "Annual",    window: "Jun–Jul",  status: "Upcoming", priority: "Medium" },
  { type: "Learnerships",          frequency: "Annual",    window: "Aug–Sep",  status: "Upcoming", priority: "Low" },
];

const PRIORITY_COLOR: Record<string, string> = {
  High:   "#ef4444",
  Medium: "#f59e0b",
  Low:    "#22c55e",
};

const STATUS_COLOR: Record<string, string> = {
  Active:    "#22c55e",
  Upcoming:  "#3b82f6",
  Overdue:   "#ef4444",
  Complete:  "#94a3b8",
};

export function AdminUpdatePlannerPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader title="Update Planner" subtitle="Annual data update schedule — APS scores, deadlines and bursaries" />

      <Card title="Annual Update Calendar">
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", overflow: "hidden", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "8px 16px", background: "var(--color-bg-secondary)", borderBottom: "1px solid var(--color-border)" }}>
            {["Data type", "Frequency", "Update window", "Priority", "Status"].map((h) => (
              <span key={h} style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
            ))}
          </div>
          {UPDATE_SCHEDULE.map((row, i) => (
            <div
              key={row.type}
              style={{
                display:       "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                padding:       "12px 16px",
                background:    i % 2 === 0 ? "var(--color-card-bg)" : "var(--color-bg-secondary)",
                alignItems:    "center",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)" }}>{row.type}</span>
              <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{row.frequency}</span>
              <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{row.window}</span>
              <Badge label={row.priority} color={PRIORITY_COLOR[row.priority] ?? "#94a3b8"} />
              <Badge label={row.status}   color={STATUS_COLOR[row.status]     ?? "#94a3b8"} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="How the Update Cycle Works">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            { step: "1", title: "Web Research Agent runs", desc: "Automatically scrapes university websites, NSFAS, and bursary providers for updated data." },
            { step: "2", title: "Change proposals generated", desc: "Agent compares scraped data against current database and flags differences for human review." },
            { step: "3", title: "Content Manager reviews proposals", desc: "Change proposals land in the Content Manager's verification queue for approval." },
            { step: "4", title: "Data Verifier cross-checks", desc: "Critical fields (APS scores, deadlines) are verified against official sources before going live." },
            { step: "5", title: "Database updated", desc: "Verified changes are applied and lastVerifiedAt timestamps are updated." },
          ].map(({ step, title, desc }) => (
            <div key={step} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--color-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>{step}</div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{title}</p>
                <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "2px" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
