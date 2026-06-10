"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, Table, TableRow, statusBadge,
  Spinner, Empty, SearchInput, Pagination, Badge, timeAgo,
} from "@/features/admin/components/AdminShell";

const ASSESSMENT_TYPES = ["INTEREST", "APTITUDE", "PERSONALITY", "VALUES"];
const TYPE_COLOR: Record<string, string> = {
  INTEREST: "#6366f1", APTITUDE: "#3b82f6", PERSONALITY: "#8b5cf6", VALUES: "#f59e0b",
};

function AssessmentDots({ sessions }: { sessions: any[] }) {
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {ASSESSMENT_TYPES.map((t) => {
        const s = sessions.find((x: any) => x.assessmentType === t);
        const color = s?.status === "COMPLETED" ? TYPE_COLOR[t] : s?.status === "IN_PROGRESS" ? "#f59e0b" : "#e2e8f0";
        return (
          <div
            key={t}
            title={`${t}: ${s?.status ?? "NOT STARTED"}`}
            style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }}
          />
        );
      })}
    </div>
  );
}

export function ManagerMyLearnersPage() {
  const [learners, setLearners]     = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    apiClient.get("/manager/learners", { params: { page } })
      .then((r) => { setLearners(r.data.data.learners); setPagination(r.data.data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? learners.filter((l) =>
        [l.email, l.firstName, l.lastName, l.school].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())
      )
    : learners;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="My Learners"
        subtitle={`${pagination.total} learners in your cohort`}
      />

      <div style={{ display: "flex", gap: "10px" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, school…" />
      </div>

      <Card noPad>
        {loading ? <Spinner /> : filtered.length === 0 ? <Empty message="No learners assigned to you yet" /> : (
          <Table headers={["Name", "Grade", "School", "Assessments", "Profile", "Last active", "Status"]}>
            {filtered.map((l) => (
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
                  l.school ?? "—",
                  <AssessmentDots sessions={l.assessmentSessions ?? []} />,
                  l.learnerProfile?.riasecType
                    ? <Badge label={l.learnerProfile.riasecType} color="#6366f1" />
                    : <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Not generated</span>,
                  l.lastActiveAt ? timeAgo(l.lastActiveAt) : "Never",
                  statusBadge(l.accountStatus),
                ]}
              />
            ))}
          </Table>
        )}
        <Pagination page={page} pages={pagination.pages} onPage={setPage} />
      </Card>

      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Assessment dots:</p>
        {ASSESSMENT_TYPES.map((t) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: TYPE_COLOR[t] }} />
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{t.toLowerCase()}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#e2e8f0" }} />
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>not started</span>
        </div>
      </div>
    </div>
  );
}
