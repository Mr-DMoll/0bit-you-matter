"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, StatCard, Spinner, Empty, Btn,
} from "@/features/admin/components/AdminShell";

export function ManagerGroupsPage() {
  const [learners, setLearners] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    apiClient.get("/manager/learners", { params: { page: 1 } })
      .then((r) => setLearners(r.data.data.learners))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const byGrade = (grade: number) => learners.filter((l) => l.grade === grade);
  const grades  = [9, 10, 11, 12, 13];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Groups"
        subtitle="Learners organised by grade — full group management coming soon"
      />

      {loading ? <Spinner /> : learners.length === 0 ? <Empty message="No learners assigned yet" /> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
            {grades.map((g) => (
              <StatCard
                key={g}
                label={g === 13 ? "Post-matric" : `Grade ${g}`}
                value={byGrade(g).length}
                sub="learners"
              />
            ))}
            <StatCard label="No grade set" value={learners.filter((l) => !l.grade).length} sub="learners" />
          </div>

          {grades.map((g) => {
            const group = byGrade(g);
            if (!group.length) return null;
            return (
              <Card key={g} title={g === 13 ? "Post-matric" : `Grade ${g}`}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {group.map((l) => (
                    <div
                      key={l.id}
                      style={{ padding: "6px 12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "var(--color-text-primary)" }}
                    >
                      {[l.firstName, l.lastName].filter(Boolean).join(" ") || l.email}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </>
      )}

      <Card title="Coming soon">
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
          Full group management — create named cohorts, assign learners manually, track cohort-level progress, and export per-cohort reports — is on the roadmap.
        </p>
      </Card>
    </div>
  );
}
