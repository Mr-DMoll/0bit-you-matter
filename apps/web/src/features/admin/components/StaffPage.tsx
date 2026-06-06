"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus } from "lucide-react";
import { adminService, type StaffUser, type InvitableRole } from "../services/admin.service";

// ── Shared styles ──────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width:        "100%",
  padding:      "10px 14px",
  background:   "var(--color-bg-subtle)",
  border:       "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  fontSize:     "14px",
  color:        "var(--color-text-primary)",
  outline:      "none",
  boxSizing:    "border-box",
};
const focusBorder = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = "var(--color-accent)";
  e.target.style.boxShadow   = "0 0 0 3px var(--color-accent-subtle)";
};
const blurBorder = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = "var(--color-border)";
  e.target.style.boxShadow   = "none";
};

// ── Status badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, React.CSSProperties> = {
    ACTIVE:    { background: "var(--color-success-subtle)", color: "var(--color-success)",  border: "1px solid var(--color-success-subtle)"  },
    PENDING:   { background: "var(--color-warning-subtle)", color: "var(--color-warning)",  border: "1px solid var(--color-warning-subtle)"  },
    SUSPENDED: { background: "var(--color-danger-subtle)",  color: "var(--color-danger)",   border: "1px solid var(--color-danger-subtle)"   },
  };
  return (
    <span style={{
      ...(map[status] ?? map.PENDING),
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: "var(--radius-pill)",
      fontSize: "11px", fontWeight: 700,
      letterSpacing: "0.04em", textTransform: "uppercase",
    }}>
      {status}
    </span>
  );
}

// ── Role badge ─────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const label = role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: "var(--radius-pill)",
      fontSize: "11px", fontWeight: 600,
      background: "var(--color-bg-secondary)",
      color: "var(--color-text-secondary)",
      border: "1px solid var(--color-border)",
    }}>
      {label}
    </span>
  );
}

// ── Invite modal ───────────────────────────────────────────────────────────────
interface InviteConfig {
  role:        InvitableRole;
  label:       string;
  placeholder: string;
}

function InviteModal({
  configs,
  onClose,
  onInvited,
}: {
  configs:   InviteConfig[];
  onClose:   () => void;
  onInvited: () => void;
}) {
  const [email,        setEmail]        = useState("");
  const [firstName,    setFirstName]    = useState("");
  const [lastName,     setLastName]     = useState("");
  const [role,         setRole]         = useState<InvitableRole>(configs[0].role);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [success,      setSuccess]      = useState(false);

  const selectedConfig = configs.find((c) => c.role === role) ?? configs[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true); setError(null);
    try {
      await adminService.inviteStaffMember({
        email: email.trim().toLowerCase(),
        firstName: firstName.trim() || undefined,
        lastName:  lastName.trim()  || undefined,
        role,
      });
      setSuccess(true);
      setTimeout(() => { onInvited(); onClose(); }, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to send invite.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{
        position: "relative", zIndex: 10,
        width: "100%", maxWidth: "460px",
        background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)", padding: "32px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
              Invite Team Member
            </h2>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              They'll receive an email to set their password.
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "18px", lineHeight: 1, padding: "4px" }}>✕</button>
        </div>

        {success ? (
          <div style={{
            padding: "24px", textAlign: "center",
            background: "var(--color-success-subtle)", borderRadius: "var(--radius-lg)",
            color: "var(--color-success)", fontSize: "15px", fontWeight: 600,
          }}>
            ✓ Invite sent to {email}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Role selector — only shown when multiple roles available */}
            {configs.length > 1 && (
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as InvitableRole)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                  onFocus={focusBorder} onBlur={blurBorder}
                >
                  {configs.map((c) => (
                    <option key={c.role} value={c.role}>{c.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Name row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  First name
                </label>
                <input
                  type="text" value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  style={inputStyle} onFocus={focusBorder} onBlur={blurBorder}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Last name
                </label>
                <input
                  type="text" value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Smith"
                  style={inputStyle} onFocus={focusBorder} onBlur={blurBorder}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Email address *
              </label>
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={selectedConfig.placeholder}
                required autoFocus
                style={inputStyle} onFocus={focusBorder} onBlur={blurBorder}
              />
            </div>

            {error && (
              <div style={{ padding: "10px 14px", background: "var(--color-danger-subtle)", border: "1px solid var(--color-danger)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-danger)" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
              <button type="button" onClick={onClose} style={{
                flex: 1, padding: "10px 0",
                background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 500,
                color: "var(--color-text-secondary)", cursor: "pointer",
              }}>
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting || !email.trim()} style={{
                flex: 1, padding: "10px 0",
                background: isSubmitting || !email.trim() ? "var(--color-accent-subtle)" : "var(--color-accent)",
                border: "none", borderRadius: "var(--radius-md)",
                fontSize: "14px", fontWeight: 600,
                color: isSubmitting || !email.trim() ? "var(--color-accent)" : "var(--color-accent-text)",
                cursor: isSubmitting || !email.trim() ? "not-allowed" : "pointer",
              }}>
                {isSubmitting ? "Sending…" : "Send Invite"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Confirm dialog ─────────────────────────────────────────────────────────────
function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onCancel }: {
  title: string; message: string; confirmLabel: string;
  danger?: boolean; onConfirm: () => Promise<void>; onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} onClick={onCancel} />
      <div style={{
        position: "relative", zIndex: 10, width: "100%", maxWidth: "360px",
        background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)", padding: "28px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
      }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 8px" }}>{title}</h3>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "0 0 24px", lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "10px 0",
            background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 500,
            color: "var(--color-text-secondary)", cursor: "pointer",
          }}>Cancel</button>
          <button
            onClick={async () => { setBusy(true); await onConfirm(); setBusy(false); }}
            disabled={busy}
            style={{
              flex: 1, padding: "10px 0",
              background: danger ? "var(--color-danger)" : "var(--color-accent)",
              border: "none", borderRadius: "var(--radius-md)",
              fontSize: "13px", fontWeight: 700, color: "#fff",
              cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Staff row ──────────────────────────────────────────────────────────────────
function StaffRow({ user, showRole, onStatusChange, onRefetch }: {
  user:           StaffUser;
  showRole:       boolean;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onRefetch:      () => void;
}) {
  const [confirm, setConfirm] = useState<"suspend" | "activate" | null>(null);

  const name = user.displayName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email;
  const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <tr
        style={{ borderBottom: "1px solid var(--color-border)", transition: "background var(--transition-fast)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--color-bg-subtle)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
      >
        {/* Name + email */}
        <td style={{ padding: "14px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "34px", height: "34px", borderRadius: "50%",
              background: "var(--color-accent-subtle)", border: "1px solid var(--color-accent-border)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-accent)" }}>{initials}</span>
            </div>
            <div>
              <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0, lineHeight: 1.2 }}>{name}</p>
              {name !== user.email && (
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: "2px 0 0" }}>{user.email}</p>
              )}
            </div>
          </div>
        </td>

        {/* Role — only when showing multiple roles */}
        {showRole && (
          <td style={{ padding: "14px 20px" }}>
            <RoleBadge role={user.role} />
          </td>
        )}

        {/* Status */}
        <td style={{ padding: "14px 20px" }}>
          <StatusBadge status={user.accountStatus} />
        </td>

        {/* Joined */}
        <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
          {new Date(user.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
        </td>

        {/* Last active */}
        <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
          {user.lastActiveAt
            ? new Date(user.lastActiveAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })
            : <span style={{ opacity: 0.4 }}>—</span>}
        </td>

        {/* Actions */}
        <td style={{ padding: "14px 20px" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            {user.accountStatus === "ACTIVE" && (
              <button onClick={() => setConfirm("suspend")} style={{
                padding: "4px 12px", fontSize: "12px", fontWeight: 600,
                color: "var(--color-warning)", background: "var(--color-warning-subtle)",
                border: "1px solid var(--color-warning-subtle)", borderRadius: "var(--radius-md)", cursor: "pointer",
              }}>Suspend</button>
            )}
            {user.accountStatus === "SUSPENDED" && (
              <button onClick={() => setConfirm("activate")} style={{
                padding: "4px 12px", fontSize: "12px", fontWeight: 600,
                color: "var(--color-accent)", background: "var(--color-accent-subtle)",
                border: "1px solid var(--color-accent-border)", borderRadius: "var(--radius-md)", cursor: "pointer",
              }}>Activate</button>
            )}
            {user.accountStatus === "PENDING" && (
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontStyle: "italic" }}>Invite pending</span>
            )}
          </div>
        </td>
      </tr>

      {confirm === "suspend" && (
        <ConfirmDialog
          title="Suspend user?" message={`${name} will lose access immediately.`}
          confirmLabel="Suspend" danger
          onConfirm={async () => { await onStatusChange(user.id, "SUSPENDED"); setConfirm(null); onRefetch(); }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === "activate" && (
        <ConfirmDialog
          title="Reactivate user?" message={`${name} will regain full access.`}
          confirmLabel="Activate"
          onConfirm={async () => { await onStatusChange(user.id, "ACTIVE"); setConfirm(null); onRefetch(); }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

// ── STAFF PAGE — the reusable component ───────────────────────────────────────

export interface StaffPageProps {
  /** Page heading shown in the header */
  title:       string;
  /** Subheading */
  description: string;
  /** Which roles this page fetches. Multiple roles = show Role column. */
  roles:       InvitableRole[];
  /** Invite modal config — one entry per invitable role */
  inviteConfigs: InviteConfig[];
}

export function StaffPage({ title, description, roles, inviteConfigs }: StaffPageProps) {
  const [users,      setUsers]      = useState<StaffUser[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const showRole = roles.length > 1;

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true); setError(null);
      // If single role, use role filter; otherwise fetch all staff
      const role = roles.length === 1 ? roles[0] : undefined;
      const res  = await adminService.getStaff({ role });
      // Filter to only the roles this page cares about (in case server returns more)
      const filtered = (res.data?.users ?? []).filter((u) => roles.includes(u.role as InvitableRole));
      setUsers(filtered);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  }, [roles]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleStatusChange = async (id: string, status: string) => {
    await adminService.updateUserStatus(id, status);
  };

  const active    = users.filter((u) => u.accountStatus === "ACTIVE").length;
  const pending   = users.filter((u) => u.accountStatus === "PENDING").length;
  const suspended = users.filter((u) => u.accountStatus === "SUSPENDED").length;

  const cols = showRole
    ? ["Name", "Role", "Status", "Joined", "Last Active", "Actions"]
    : ["Name", "Status", "Joined", "Last Active", "Actions"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", margin: 0 }}>
            {title}
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>{description}</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 18px", background: "var(--color-accent)",
            border: "none", borderRadius: "var(--radius-md)",
            fontSize: "13.5px", fontWeight: 600,
            color: "var(--color-accent-text)", cursor: "pointer",
            transition: "background var(--transition-fast)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-accent)"; }}
        >
          <UserPlus size={15} strokeWidth={2} /> Invite
        </button>
      </div>

      {/* Stat chips */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {[
          { label: "Active",    value: active,    color: "var(--color-success)", subtle: "var(--color-success-subtle)" },
          { label: "Pending",   value: pending,   color: "var(--color-warning)", subtle: "var(--color-warning-subtle)" },
          { label: "Suspended", value: suspended, color: "var(--color-danger)",  subtle: "var(--color-danger-subtle)"  },
        ].map(({ label, value, color, subtle }) => (
          <div key={label} style={{
            padding: "16px 24px",
            background: "var(--color-card-bg)",
            border: "1px solid var(--color-card-border)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--color-card-shadow)",
            minWidth: "120px",
          }}>
            <div style={{ fontSize: "26px", fontWeight: 800, color, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "5px" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)",
        borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)", overflow: "hidden",
      }}>
        {isLoading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "14px" }}>Loading…</div>
        ) : error ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--color-danger)", fontSize: "14px" }}>{error}</div>
        ) : users.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "8px" }}>No {title.toLowerCase()} yet</p>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "20px" }}>Invite someone to get started.</p>
            <button onClick={() => setShowInvite(true)} style={{
              padding: "10px 20px", background: "var(--color-accent)", border: "none",
              borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 600,
              color: "var(--color-accent-text)", cursor: "pointer",
            }}>
              Send first invite
            </button>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {cols.map((h) => (
                  <th key={h} style={{
                    padding: "12px 20px", textAlign: "left",
                    fontSize: "11px", fontWeight: 700,
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    background: "var(--color-bg-subtle)",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <StaffRow
                  key={u.id}
                  user={u}
                  showRole={showRole}
                  onStatusChange={handleStatusChange}
                  onRefetch={fetchUsers}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showInvite && (
        <InviteModal
          configs={inviteConfigs}
          onClose={() => setShowInvite(false)}
          onInvited={fetchUsers}
        />
      )}
    </div>
  );
}
