"use client";

import { useRouter } from "next/navigation";

// ── Shared primitives used across all admin pages ─────────────────────────────

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 600, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>{title}</h1>
        {subtitle && <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "3px" }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Card({
  title,
  children,
  action,
  noPad,
}: {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  noPad?: boolean;
}) {
  return (
    <div style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
      {title && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--color-border)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{title}</h3>
          {action}
        </div>
      )}
      <div style={noPad ? {} : { padding: "16px 20px" }}>{children}</div>
    </div>
  );
}

export function StatCard({ label, value, sub, accent, color, icon }: {
  label: string; value: string | number; sub?: string; accent?: string; color?: string; icon?: string;
}) {
  const bg   = color ? `${color}12` : "var(--color-card-bg)";
  const border = color ? `${color}28` : "var(--color-card-border)";
  const numColor = color ?? accent ?? "var(--color-text-primary)";
  return (
    <div style={{
      padding: "20px 24px", background: bg,
      border: `1px solid ${border}`,
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--color-card-shadow)",
      borderTop: color ? `3px solid ${color}` : "1px solid var(--color-card-border)",
      position: "relative", overflow: "hidden",
    }}>
      {icon && (
        <div style={{
          position: "absolute", top: 14, right: 16,
          fontSize: 22, opacity: 0.18, lineHeight: 1,
        }}>{icon}</div>
      )}
      <p style={{ fontSize: "11px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>{label}</p>
      <p style={{ fontSize: "32px", fontWeight: 700, color: numColor, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "6px" }}>{sub}</p>}
    </div>
  );
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {label}
    </span>
  );
}

export const STATUS_COLORS: Record<string, string> = {
  AI_GENERATED: "#94a3b8",
  IN_REVIEW:    "#f59e0b",
  APPROVED:     "#3b82f6",
  VERIFIED:     "#22c55e",
  REJECTED:     "#ef4444",
  ARCHIVED:     "#64748b",
  ACTIVE:       "#22c55e",
  PENDING:      "#f59e0b",
  SUSPENDED:    "#ef4444",
  DELETED:      "#64748b",
  QUEUED:       "#94a3b8",
  PROCESSING:   "#3b82f6",
  COMPLETED:    "#22c55e",
  FAILED:       "#ef4444",
};

export function statusBadge(status: string) {
  const color = STATUS_COLORS[status] ?? "#94a3b8";
  const label = status.replace(/_/g, " ");
  return <Badge label={label} color={color} />;
}

export function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "60px", color: "var(--color-text-muted)" }}>
      <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <span style={{ fontSize: "13px" }}>Loading…</span>
    </div>
  );
}

export function Empty({ message }: { message?: string }) {
  return (
    <p style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", padding: "40px 0" }}>
      {message ?? "No data yet."}
    </p>
  );
}

export function Btn({
  label,
  onClick,
  variant = "primary",
  small,
}: {
  label: string;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  small?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: "var(--color-accent)", color: "#fff",                      border: "none" },
    ghost:   { background: "transparent",         color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" },
    danger:  { background: "transparent",         color: "#ef4444",                   border: "1px solid #ef444430" },
  };
  return (
    <button
      onClick={onClick}
      style={{
        ...styles[variant],
        padding:       small ? "5px 12px" : "7px 16px",
        fontSize:      small ? "12px" : "13px",
        fontWeight:    600,
        borderRadius:  "var(--radius-sm)",
        cursor:        "pointer",
      }}
    >
      {label}
    </button>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Search…"}
      style={{
        padding:      "7px 12px",
        fontSize:     "13px",
        background:   "var(--color-bg-secondary)",
        border:       "1px solid var(--color-border)",
        borderRadius: "var(--radius-sm)",
        color:        "var(--color-text-primary)",
        width:        "240px",
        outline:      "none",
      }}
    />
  );
}

export function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding:      "7px 10px",
        fontSize:     "13px",
        background:   "var(--color-bg-secondary)",
        border:       "1px solid var(--color-border)",
        borderRadius: "var(--radius-sm)",
        color:        "var(--color-text-primary)",
        cursor:       "pointer",
      }}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function TableRow({ cols, onClick }: { cols: React.ReactNode[]; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: "1px solid var(--color-border)",
        cursor:       onClick ? "pointer" : "default",
        transition:   "background 0.1s",
      }}
      onMouseEnter={(e) => { if (onClick) (e.currentTarget as HTMLElement).style.background = "var(--color-bg-secondary)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
    >
      {cols.map((c, i) => (
        <td key={i} style={{ padding: "10px 16px", fontSize: "13px", color: "var(--color-text-secondary)", verticalAlign: "middle" }}>{c}</td>
      ))}
    </tr>
  );
}

export function Table({ headers, children }: { headers: (string | React.ReactNode)[]; children: React.ReactNode }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: "10px 16px", fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "left" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 0", justifyContent: "center" }}>
      <Btn label="← Prev" onClick={() => onPage(page - 1)} variant="ghost" small />
      <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Page {page} of {pages}</span>
      <Btn label="Next →" onClick={() => onPage(page + 1)} variant="ghost" small />
    </div>
  );
}

export function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7)  return `${d}d ago`;
  return new Date(date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

export function displayName(u: any) {
  return u?.displayName || [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.email || "—";
}

export function InviteModal({
  open,
  onClose,
  onSubmit,
  role,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { email: string; firstName: string; lastName: string }) => Promise<void>;
  role: string;
  title: string;
}) {
  const [email, setEmail]         = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName]   = React.useState("");
  const [loading, setLoading]     = React.useState(false);
  const [error, setError]         = React.useState("");

  if (!open) return null;

  const handleSubmit = async () => {
    if (!email) { setError("Email is required"); return; }
    setLoading(true); setError("");
    try {
      await onSubmit({ email, firstName, lastName });
      setEmail(""); setFirstName(""); setLastName("");
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-lg)", padding: "28px", width: "400px", maxWidth: "90vw" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px", color: "var(--color-text-primary)" }}>{title}</h2>
        {error && <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "12px" }}>{error}</p>}
        {[
          { label: "Email *",     value: email,     set: setEmail,     type: "email" },
          { label: "First name",  value: firstName, set: setFirstName, type: "text" },
          { label: "Last name",   value: lastName,  set: setLastName,  type: "text" },
        ].map(({ label, value, set, type }) => (
          <div key={label} style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "4px" }}>{label}</label>
            <input
              type={type}
              value={value}
              onChange={(e) => set(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", fontSize: "13px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        ))}
        <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
          <Btn label="Cancel" onClick={onClose} variant="ghost" />
          <Btn label={loading ? "Sending…" : "Send Invite"} onClick={handleSubmit} />
        </div>
      </div>
    </div>
  );
}

// ── Confirm Delete Modal ───────────────────────────────────────────────────────
export function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  name,
  email,
}: {
  open:      boolean;
  onClose:   () => void;
  onConfirm: () => Promise<void>;
  name:      string;
  email:     string;
}) {
  const [loading, setLoading] = React.useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try { await onConfirm(); } finally { setLoading(false); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {/* Backdrop click closes */}
      <div style={{ position: "absolute", inset: 0 }} onClick={onClose} />

      <div style={{
        position: "relative", zIndex: 1,
        background: "var(--color-card-bg)",
        border: "1px solid var(--color-card-border)",
        borderRadius: "var(--radius-lg)",
        padding: "28px 28px 24px",
        width: 400, maxWidth: "90vw",
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
      }}>
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "rgba(239,68,68,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 16,
        }}>
          <span style={{ fontSize: 20 }}>🗑️</span>
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
          Delete user?
        </h2>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 6px", lineHeight: 1.6 }}>
          You are about to permanently delete:
        </p>
        <div style={{
          background: "var(--color-bg-subtle)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
          padding: "10px 14px",
          marginBottom: 16,
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 2px" }}>{name}</p>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>{email}</p>
        </div>
        <p style={{ fontSize: 12, color: "#ef4444", margin: "0 0 22px", lineHeight: 1.5 }}>
          This is permanent and cannot be undone. The email address will be freed up for reuse.
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 500,
              background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)", color: "var(--color-text-secondary)", cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 700,
              background: loading ? "rgba(239,68,68,0.5)" : "#ef4444",
              border: "none", borderRadius: "var(--radius-sm)",
              color: "#fff", cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Deleting…" : "Yes, delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// need React in scope for the modal
import React from "react";
