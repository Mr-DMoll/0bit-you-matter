"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, StatCard, Table, TableRow, Spinner, Empty, Btn, Badge,
} from "@/features/admin/components/AdminShell";

const ASSESSMENT_TYPES = ["INTEREST", "APTITUDE", "PERSONALITY", "VALUES"] as const;
const TYPE_COLOR: Record<string, string> = {
  INTEREST: "#6366f1", APTITUDE: "#3b82f6", PERSONALITY: "#8b5cf6", VALUES: "#f59e0b",
};

export function ManagerGroupSessionPage() {
  const [learners, setLearners]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [sessionLive, setSessionLive] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiClient.get("/manager/learners", { params: { page: 1 } })
      .then((r) => setLearners(r.data.data.learners))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const completedType = (learner: any, type: string) =>
    (learner.assessmentSessions ?? []).some((s: any) => s.assessmentType === type && s.status === "COMPLETED");

  const inProgressType = (learner: any, type: string) =>
    (learner.assessmentSessions ?? []).some((s: any) => s.assessmentType === type && s.status === "IN_PROGRESS");

  const doneCount = activeType
    ? learners.filter((l) => completedType(l, activeType)).length
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Group Session"
        subtitle="Facilitated mode — run your class through an assessment and monitor completion live"
      />

      {!sessionLive ? (
        <>
          <Card title="Select assessment to run">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
              {ASSESSMENT_TYPES.map((t) => {
                const done = learners.filter((l) => completedType(l, t)).length;
                return (
                  <button
                    key={t}
                    onClick={() => { setActiveType(t); setSessionLive(true); }}
                    style={{
                      padding:      "16px",
                      background:   activeType === t ? `${TYPE_COLOR[t]}15` : "var(--color-bg-secondary)",
                      border:       `2px solid ${activeType === t ? TYPE_COLOR[t] : "var(--color-border)"}`,
                      borderRadius: "var(--radius-lg)",
                      cursor:       "pointer",
                      textAlign:    "left",
                      transition:   "border-color 0.15s",
                    }}
                  >
                    <p style={{ fontSize: "13px", fontWeight: 600, color: TYPE_COLOR[t], marginBottom: "4px" }}>{t}</p>
                    <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                      {done}/{learners.length} learners done
                    </p>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card title="How group sessions work">
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                "Choose an assessment above — this locks you into live monitor mode for that type.",
                "Ask your class to open the You Matter app and navigate to their assessment.",
                "Watch the completion tracker update in real time as learners submit answers.",
                "At the end, prompt incomplete learners to finish or save progress for next time.",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", flexShrink: 0 }}>{i + 1}</div>
                  <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", paddingTop: "2px" }}>{step}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                Live session — {activeType} assessment
              </span>
            </div>
            <Btn label="End session" onClick={() => { setSessionLive(false); setActiveType(null); }} variant="danger" small />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
            <StatCard label="Total learners" value={learners.length} />
            <StatCard label="Completed"      value={doneCount}              accent="#22c55e" />
            <StatCard label="In progress"    value={learners.filter((l) => inProgressType(l, activeType!)).length} accent="#f59e0b" />
            <StatCard label="Not started"    value={learners.length - doneCount - learners.filter((l) => inProgressType(l, activeType!)).length} accent="#94a3b8" />
          </div>

          {loading ? <Spinner /> : (
            <Card title={`Completion — ${activeType}`} noPad>
              <Table headers={["Learner", "Grade", "Status"]}>
                {learners.map((l) => {
                  const done = completedType(l, activeType!);
                  const inProg = inProgressType(l, activeType!);
                  const statusLabel = done ? "Completed" : inProg ? "In progress" : "Not started";
                  const statusColor = done ? "#22c55e"   : inProg ? "#f59e0b"     : "#94a3b8";
                  return (
                    <TableRow
                      key={l.id}
                      cols={[
                        <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
                          {[l.firstName, l.lastName].filter(Boolean).join(" ") || l.email}
                        </span>,
                        l.grade ? `Grade ${l.grade}` : "—",
                        <Badge label={statusLabel} color={statusColor} />,
                      ]}
                    />
                  );
                })}
              </Table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
