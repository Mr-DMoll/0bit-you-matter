"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, Table, TableRow,
  statusBadge, Spinner, Empty, SearchInput, Select, Pagination, timeAgo,
} from "../components/AdminShell";

const PROVINCES = [
  { label: "All provinces", value: "" },
  { label: "Gauteng",       value: "Gauteng" },
  { label: "Western Cape",  value: "Western Cape" },
  { label: "KwaZulu-Natal", value: "KwaZulu-Natal" },
  { label: "Eastern Cape",  value: "Eastern Cape" },
  { label: "Free State",    value: "Free State" },
  { label: "Limpopo",       value: "Limpopo" },
  { label: "Mpumalanga",    value: "Mpumalanga" },
  { label: "Northern Cape", value: "Northern Cape" },
  { label: "North West",    value: "North West" },
];

export function AdminLearnersPage() {
  const [learners, setLearners] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [province, setProvince] = useState("");
  const [status, setStatus]     = useState("");
  const [page, setPage]         = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    const params: any = { page };
    if (province) params.province = province;
    if (status)   params.status   = status;
    apiClient.get("/admin/learners", { params })
      .then((r) => { setLearners(r.data.data.users); setPagination(r.data.data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, province, status]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? learners.filter((l) =>
        [l.email, l.firstName, l.lastName, l.school]
          .filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())
      )
    : learners;

  const assessmentsDone = (l: any) =>
    (l.assessmentSessions ?? []).filter((s: any) => s.status === "COMPLETED").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Learners"
        subtitle={`${pagination.total} total learners`}
      />

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, school…" />
        <Select value={province} onChange={(v) => { setProvince(v); setPage(1); }} options={PROVINCES} />
        <Select
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          options={[
            { label: "All statuses", value: "" },
            { label: "Active",       value: "ACTIVE" },
            { label: "Pending",      value: "PENDING" },
            { label: "Suspended",    value: "SUSPENDED" },
          ]}
        />
      </div>

      <Card noPad>
        {loading ? <Spinner /> : filtered.length === 0 ? <Empty message="No learners found" /> : (
          <Table headers={["Name", "Grade", "Province", "School", "Assessments", "Status", "Last active"]}>
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
                  l.province ?? "—",
                  l.school ?? "—",
                  <span>{assessmentsDone(l)}/4 complete</span>,
                  statusBadge(l.accountStatus),
                  l.lastActiveAt ? timeAgo(l.lastActiveAt) : "Never",
                ]}
              />
            ))}
          </Table>
        )}
        <Pagination page={page} pages={pagination.pages} onPage={setPage} />
      </Card>
    </div>
  );
}
