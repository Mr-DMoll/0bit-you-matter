"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, Table, TableRow, statusBadge,
  Spinner, Empty, Btn, SearchInput, Pagination, InviteModal, timeAgo,
} from "../components/AdminShell";

interface StaffDirectoryPageProps {
  role: string;       // "MANAGER" | "REVIEWER" | "DATA_VERIFIER" | "CONTENT_MANAGER"
  title: string;
  subtitle: string;
}

export function StaffDirectoryPage({ role, title, subtitle }: StaffDirectoryPageProps) {
  const [users, setUsers]           = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [success, setSuccess]       = useState("");

  const load = useCallback(() => {
    setLoading(true);
    apiClient.get("/admin/staff", { params: { role, page } })
      .then((r) => { setUsers(r.data.data.users); setPagination(r.data.data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [role, page]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? users.filter((u) =>
        [u.email, u.firstName, u.lastName].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const handleInvite = async (data: { email: string; firstName: string; lastName: string }) => {
    await apiClient.post("/admin/staff/invite", { ...data, role });
    setSuccess(`Invite sent to ${data.email}`);
    setTimeout(() => setSuccess(""), 4000);
    load();
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    await apiClient.patch(`/admin/users/${id}/status`, { status: next });
    load();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={<Btn label={`Invite ${title.replace(/s$/, "")}`} onClick={() => setInviteOpen(true)} />}
      />

      {success && (
        <div style={{ padding: "10px 16px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#22c55e" }}>
          {success}
        </div>
      )}

      <div style={{ display: "flex", gap: "10px" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" />
      </div>

      <Card noPad>
        {loading ? <Spinner /> : filtered.length === 0 ? <Empty message={`No ${title.toLowerCase()} yet`} /> : (
          <Table headers={["Name", "Email", "Status", "Joined", "Last active", ""]}>
            {filtered.map((u) => (
              <TableRow
                key={u.id}
                cols={[
                  <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
                    {[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}
                  </span>,
                  u.email,
                  statusBadge(u.accountStatus),
                  new Date(u.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }),
                  u.lastActiveAt ? timeAgo(u.lastActiveAt) : "Never",
                  <Btn
                    label={u.accountStatus === "ACTIVE" ? "Suspend" : "Activate"}
                    onClick={() => toggleStatus(u.id, u.accountStatus)}
                    variant={u.accountStatus === "ACTIVE" ? "danger" : "ghost"}
                    small
                  />,
                ]}
              />
            ))}
          </Table>
        )}
        <Pagination page={page} pages={pagination.pages} onPage={setPage} />
      </Card>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={handleInvite}
        role={role}
        title={`Invite ${title.replace(/s$/, "")}`}
      />
    </div>
  );
}
