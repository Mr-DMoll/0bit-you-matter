"use client";

import { useState, useEffect } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, Table, TableRow,
  Spinner, Empty, timeAgo,
} from "@/features/admin/components/AdminShell";

const ASSESSMENT_TYPES = ["INTEREST", "APTITUDE", "PERSONALITY", "VALUES"];

export function ManagerAtRiskPage() {
  const [learners, setLearners] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    apiClient.get("/manager/at-risk")
      .then((r) => setLearners(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const completedCount = (sessions: any[]) =>
    sessions.filter((s: any) => s.status === "COMPLETED").length;

  const inProgress = (sessions: any[]) =>
    sessions.find((s: any) => s.status === "IN_PROGRESS")?.assessmentType ?? null;

  const daysSinceActive = (dateStr: string | null) => {
    if (!dateStr) return null;
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="At Risk"
        subtitle="Learners who have been inactive for 14 or more days"
      />

      {!loading && learners.length > 0 && (
        <div style={{ padding: "12px 18px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-lg)", fontSize: "13px", color: "#ef4444", fontWeight: 500 }}>
          ⚠️ {learners.length} learner{learners.length > 1 ? "s" : ""} need your attention
        </div>
      )}

      <Card noPad>
        {loading ? <Spinner /> : learners.length === 0
          ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <p style={{ fontSize: "22px", marginBottom: "8px" }}>✅</p>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>All learners are active</p>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No learners have been inactive for 14+ days.</p>
            </div>
          )
          : (
            <Table headers={["Name", "Grade", "Last active", "Days inactive", "Assessments done", "Stalled on", "Action"]}>
              {learners.map((l) => {
                const days = daysSinceActive(l.lastActiveAt);
                const done = completedCount(l.assessmentSessions ?? []);
                const stuck = inProgress(l.assessmentSessions ?? []);
                return (
                  <TableRow
                    key={l.id}
                    cols={[
                      <div>
                        <p style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
                          {[l.firstName, l.lastName].filter(Boolean).join(" ") || "—"}
                        </p>
                        <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{l.email}</p>
                      </div>,
                      l.grade ? `Grade ${l.grade}` : "—",
                      l.lastActiveAt ? timeAgo(l.lastActiveAt) : <span style={{ color: "#ef4444" }}>Never logged in</span>,
                      days != null
                        ? <span style={{ color: days > 30 ? "#ef4444" : "#f59e0b", fontWeight: 600 }}>{days}d</span>
                        : "—",
                      `${done}/4`,
                      stuck
                        ? <span style={{ fontSize: "12px", color: "#f59e0b" }}>{stuck.toLowerCase()}</span>
                        : done === 0
                        ? <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Not started</span>
                        : "—",
                      <a
                        href={`mailto:${l.email}`}
                        style={{ fontSize: "12px", color: "var(--color-accent)", textDecoration: "none", fontWeight: 500 }}
                      >
                        Email →
                      </a>,
                    ]}
                  />
                );
              })}
            </Table>
          )
        }
      </Card>
    </div>
  );
}
