"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus } from "lucide-react";
import { adminService, type InvitableRole } from "../services/admin.service";
import apiClient from "@/api/client";
import {
  PageHeader, Card, Table, TableRow,
  statusBadge, Spinner, Empty, SearchInput, Pagination, timeAgo,
} from "../components/AdminShell";

// ── Role config ───────────────────────────────────────────────────────────────
const ROLE_TABS = [
  { key: "ALL",             label: "All Users"       },
  { key: "LEARNER",         label: "Learners"        },
  { key: "CONTENT_MANAGER", label: "Content Managers"},
  { key: "REVIEWER",        label: "Reviewers"       },
] as const;

type RoleKey = typeof ROLE_TABS[number]["key"];

const INVITABLE_ROLES: { value: InvitableRole; label: string }[] = [
  { value: "CONTENT_MANAGER", label: "Content Manager" },
  { value: "REVIEWER",        label: "Reviewer"        },
];

const ROLE_COLORS: Record<string, string> = {
  LEARNER:         "#5B4FCF",
  MANAGER:         "#0D9488",
  CONTENT_MANAGER: "#7C3AED",
  REVIEWER:        "#2563EB",
  DATA_VERIFIER:   "#059669",
};

// ── Shared input style ────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  background: "var(--color-bg-subtle)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  fontSize: "14px", color: "var(--color-text-primary)",
  outline: "none", boxSizing: "border-box",
};
const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = "var(--color-accent)";
  e.target.style.boxShadow   = "0 0 0 3px var(--color-accent-subtle)";
};
const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = "var(--color-border)";
  e.target.style.boxShadow   = "none";
};

// ── Role pill ─────────────────────────────────────────────────────────────────
function RolePill({ role }: { role: string }) {
  const color = ROLE_COLORS[role] ?? "#94A3B8";
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
      background: `${color}14`, color, border: `1px solid ${color}28`,
      textTransform: "uppercase", letterSpacing: "0.04em",
    }}>
      {role.replace("_", " ")}
    </span>
  );
}

// ── Avatar initials ───────────────────────────────────────────────────────────
function Avatar({ user }: { user: any }) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
  const color = ROLE_COLORS[user.role] ?? "#5B4FCF";
  return (
    <div style={{
      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
      background: `${color}18`, border: `1px solid ${color}30`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {user.avatarUrl
        ? <img src={user.avatarUrl} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
        : <span style={{ fontSize: 12, fontWeight: 700, color }}>{initials}</span>
      }
    </div>
  );
}

// ── Invite modal ──────────────────────────────────────────────────────────────
function InviteModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [role,      setRole]      = useState<InvitableRole>("CONTENT_MANAGER");
  const [busy,      setBusy]      = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true); setError(null);
    try {
      await adminService.inviteStaffMember({
        email: email.trim().toLowerCase(),
        firstName: firstName.trim() || undefined,
        lastName:  lastName.trim()  || undefined,
        role,
      });
      onDone(); onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to send invitation.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{
        position: "relative", zIndex: 10, width: "100%", maxWidth: 460,
        background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)", padding: 32,
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)" }}>Invite User</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-muted)" }}>
              They'll receive an email to set their password.
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--color-text-muted)", lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Name row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>First Name</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" style={inp} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Last Name</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Smith" style={inp} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" required autoFocus style={inp} onFocus={onFocus} onBlur={onBlur} />
          </div>

          {/* Role */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as InvitableRole)}
              style={{ ...inp, cursor: "pointer" }}
              onFocus={onFocus} onBlur={onBlur as any}
            >
              {INVITABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "var(--color-danger-subtle)", border: "1px solid var(--color-danger)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--color-danger)" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: 10,
              background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)", fontSize: 14, fontWeight: 500,
              color: "var(--color-text-secondary)", cursor: "pointer",
            }}>Cancel</button>
            <button type="submit" disabled={busy || !email.trim()} style={{
              flex: 1, padding: 10,
              background: busy || !email.trim() ? "var(--color-accent-subtle)" : "var(--color-accent)",
              border: "none", borderRadius: "var(--radius-md)",
              fontSize: 14, fontWeight: 700,
              color: busy || !email.trim() ? "var(--color-accent)" : "var(--color-accent-text)",
              cursor: busy || !email.trim() ? "not-allowed" : "pointer",
            }}>
              {busy ? "Sending…" : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onCancel }: {
  title: string; message: string; confirmLabel: string;
  danger?: boolean; onConfirm: () => Promise<void>; onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={onCancel} />
      <div style={{
        position: "relative", zIndex: 10, width: "100%", maxWidth: 360,
        background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)", padding: 28,
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
      }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</h3>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: 10,
            background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 500,
            color: "var(--color-text-secondary)", cursor: "pointer",
          }}>Cancel</button>
          <button onClick={async () => { setBusy(true); await onConfirm(); setBusy(false); }} disabled={busy} style={{
            flex: 1, padding: 10,
            background: danger ? "var(--color-danger)" : "var(--color-accent)",
            border: "none", borderRadius: "var(--radius-md)",
            fontSize: 13, fontWeight: 700, color: "#fff",
            cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1,
          }}>
            {busy ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── User row ──────────────────────────────────────────────────────────────────
function UserRow({ user, onRefetch }: { user: any; onRefetch: () => void }) {
  const [confirm, setConfirm] = useState<"suspend" | "activate" | "delete" | null>(null);
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const isLearner = user.role === "LEARNER";

  const doStatus = async (status: string) => {
    await adminService.updateUserStatus(user.id, status);
    setConfirm(null); onRefetch();
  };
  const doDelete = async () => {
    await adminService.deleteUser(user.id);
    setConfirm(null); onRefetch();
  };

  return (
    <>
      <TableRow cols={[
        // Name + email
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar user={user} />
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "var(--color-text-primary)" }}>{name}</p>
            {name !== user.email && <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)" }}>{user.email}</p>}
          </div>
        </div>,

        // Role
        <RolePill role={user.role} />,

        // Status
        statusBadge(user.accountStatus),

        // Learner extras or joined
        isLearner
          ? <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              {user.grade ? `Grade ${user.grade}` : "—"} · {user.province ?? "—"}
            </span>
          : <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "—"}
            </span>,

        // Last active
        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
          {user.lastActiveAt ? timeAgo(user.lastActiveAt) : "Never"}
        </span>,

        // Actions
        <div style={{ display: "flex", gap: 6 }}>
          {user.accountStatus === "ACTIVE" && (
            <button onClick={() => setConfirm("suspend")} style={{
              padding: "3px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", borderRadius: "var(--radius-sm)",
              color: "var(--color-warning)", background: "var(--color-warning-subtle)", border: "1px solid var(--color-warning-subtle)",
            }}>Suspend</button>
          )}
          {user.accountStatus === "SUSPENDED" && (
            <button onClick={() => setConfirm("activate")} style={{
              padding: "3px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", borderRadius: "var(--radius-sm)",
              color: "var(--color-accent)", background: "var(--color-accent-subtle)", border: "1px solid var(--color-accent-border)",
            }}>Activate</button>
          )}
          {user.accountStatus === "PENDING" && (
            <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontStyle: "italic" }}>Pending</span>
          )}
          <button onClick={() => setConfirm("delete")} style={{
            padding: "3px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", borderRadius: "var(--radius-sm)",
            color: "var(--color-danger)", background: "var(--color-danger-subtle)", border: "1px solid var(--color-danger-subtle)",
          }}>Delete</button>
        </div>,
      ]} />

      {confirm === "suspend"  && <ConfirmDialog title="Suspend user?" message={`${name} will lose access immediately.`} confirmLabel="Suspend" danger onConfirm={() => doStatus("SUSPENDED")} onCancel={() => setConfirm(null)} />}
      {confirm === "activate" && <ConfirmDialog title="Reactivate user?" message={`${name} will regain access.`} confirmLabel="Activate" onConfirm={() => doStatus("ACTIVE")} onCancel={() => setConfirm(null)} />}
      {confirm === "delete"   && <ConfirmDialog title="Delete user?" message={`This permanently deletes ${name}. This cannot be undone.`} confirmLabel="Delete" danger onConfirm={doDelete} onCancel={() => setConfirm(null)} />}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function AdminUsersPage() {
  const [tab,        setTab]        = useState<RoleKey>("ALL");
  const [users,      setUsers]      = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [showInvite, setShowInvite] = useState(false);

  const load = useCallback(() => {
    setLoading(true);

    let req: Promise<{ users: any[]; pagination: any }>;

    if (tab === "LEARNER") {
      req = apiClient.get("/admin/learners", { params: { page } })
        .then((r) => r.data.data)
        .catch(() => ({ users: [], pagination: { total: 0, page: 1, pages: 1 } }));
    } else if (tab === "ALL") {
      req = Promise.all([
        apiClient.get("/admin/learners", { params: { page: 1, limit: 200 } })
          .then((r) => r.data.data?.users ?? []).catch(() => []),
        apiClient.get("/admin/staff", { params: { page: 1, limit: 200 } })
          .then((r) => r.data.data?.users ?? []).catch(() => []),
      ]).then(([learners, staff]) => ({
        users: [...learners, ...staff],
        pagination: { total: learners.length + staff.length, page: 1, pages: 1 },
      }));
    } else {
      req = adminService.getStaff({ role: tab as InvitableRole, page })
        .then((r) => r.data)
        .catch(() => ({ users: [], pagination: { total: 0, page: 1, pages: 1 } }));
    }

    req.then((d) => {
      setUsers(d.users ?? []);
      setPagination(d.pagination ?? { total: 0, page: 1, pages: 1 });
    }).finally(() => setLoading(false));
  }, [tab, page]);

  useEffect(() => { setPage(1); }, [tab]);
  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? users.filter((u) =>
        [u.email, u.firstName, u.lastName, u.school, u.province]
          .filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  // Role counts for tab badges (from current load — approximate)
  const roleCounts = ROLE_TABS.reduce((acc, t) => {
    acc[t.key] = t.key === "ALL" ? pagination.total : users.filter((u) => u.role === t.key).length;
    return acc;
  }, {} as Record<string, number>);

  const headers = tab === "LEARNER" || tab === "ALL"
    ? ["User", "Role", "Status", "Grade · Province", "Last active", "Actions"]
    : ["User", "Role", "Status", "Joined", "Last active", "Actions"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader
        title="Users"
        subtitle={`${pagination.total} user${pagination.total !== 1 ? "s" : ""} across all roles`}
        action={
          <button
            onClick={() => setShowInvite(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 18px", background: "var(--color-accent)",
              border: "none", borderRadius: "var(--radius-md)",
              fontSize: 13, fontWeight: 600, color: "var(--color-accent-text)", cursor: "pointer",
            }}
          >
            <UserPlus size={15} />
            Invite User
          </button>
        }
      />

      {/* Role tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--color-border)" }}>
        {ROLE_TABS.map((t) => {
          const active = t.key === tab;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "9px 16px", fontSize: 13,
              fontWeight: active ? 700 : 500,
              color: active ? "var(--color-accent)" : "var(--color-text-muted)",
              background: "transparent", border: "none",
              borderBottom: active ? "2px solid var(--color-accent)" : "2px solid transparent",
              marginBottom: -1, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, school…" />

      {/* Table */}
      <Card noPad>
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <Empty message={`No ${tab === "ALL" ? "users" : tab.toLowerCase().replace("_", " ")} found`} />
        ) : (
          <Table headers={headers}>
            {filtered.map((u) => <UserRow key={u.id} user={u} onRefetch={load} />)}
          </Table>
        )}
        <Pagination page={page} pages={pagination.pages} onPage={setPage} />
      </Card>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onDone={load} />}
    </div>
  );
}
