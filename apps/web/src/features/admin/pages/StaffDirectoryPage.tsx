"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, Table, TableRow, statusBadge,
  Spinner, Empty, Btn, SearchInput, Pagination, InviteModal, ConfirmDeleteModal, timeAgo,
} from "../components/AdminShell";

interface StaffDirectoryPageProps {
  role: string;       // "MANAGER" | "REVIEWER" | "CONTENT_MANAGER"
  title: string;
  subtitle: string;
}

// ── Reviewer profile drawer ───────────────────────────────────────────────────

function ReviewerProfileDrawer({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [spec, setSpec]       = useState("");
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    setLoading(true);
    apiClient.get(`/admin/reviewers/${userId}/profile`)
      .then((r) => {
        setProfile(r.data.data);
        setSpec(r.data.data.user.specialisation ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const saveSpec = async () => {
    setSaving(true);
    try {
      await apiClient.patch(`/admin/reviewers/${userId}/profile`, { specialisation: spec });
      setProfile((p: any) => ({ ...p, user: { ...p.user, specialisation: spec } }));
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", fontSize: "13px", boxSizing: "border-box",
    background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none",
  };

  const u = profile?.user;
  const s = profile?.stats;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 40 }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "460px", maxWidth: "92vw",
        background: "var(--color-card-bg)", borderLeft: "1px solid var(--color-card-border)",
        zIndex: 50, overflowY: "auto", boxShadow: "-4px 0 32px rgba(0,0,0,0.14)",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "var(--color-card-bg)", zIndex: 1 }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>Reviewer Profile</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "22px", color: "var(--color-text-muted)", lineHeight: 1 }}>×</button>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}><Spinner /></div>
        ) : !u ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Could not load profile</div>
        ) : (
          <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Identity */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(99,102,241,0.15)", border: "2px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800, color: "#6366f1", flexShrink: 0 }}>
                {([u.firstName, u.lastName].filter(Boolean).join(" ") || u.email).split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                  {[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}
                </p>
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{u.email}</p>
                <div style={{ marginTop: "4px" }}>{statusBadge(u.accountStatus)}</div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { label: "Reviews done",    value: s?.totalReviews ?? 0,   color: "#6366f1" },
                { label: "Verified",        value: s?.verifiedCount ?? 0,  color: "#22c55e" },
                { label: "Discarded",       value: s?.discardedCount ?? 0, color: "#ef4444" },
                { label: "In queue",        value: s?.pendingCount ?? 0,   color: "#f59e0b" },
              ].map((st) => (
                <div key={st.label} style={{ padding: "12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{st.label}</p>
                  <p style={{ fontSize: "22px", fontWeight: 800, color: st.color, marginTop: "2px" }}>{st.value}</p>
                </div>
              ))}
            </div>

            {/* Specialisation */}
            <div style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)" }}>Specialisation</p>
                {!editing && (
                  <button onClick={() => setEditing(true)} style={{ fontSize: "11px", padding: "3px 8px", background: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-muted)", cursor: "pointer" }}>
                    ✏ Edit
                  </button>
                )}
              </div>

              {editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input
                    style={inputStyle}
                    value={spec}
                    onChange={(e) => setSpec(e.target.value)}
                    placeholder="e.g. Educational Psychologist, STEM careers, Career Counsellor"
                  />
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                    Separate multiple specialisations with commas. This helps assign the right content to review.
                  </p>
                  <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                    <Btn label="Cancel" onClick={() => { setEditing(false); setSpec(u.specialisation ?? ""); }} variant="ghost" small />
                    <Btn label={saving ? "Saving…" : "Save"} onClick={saveSpec} small />
                  </div>
                </div>
              ) : (
                <div>
                  {saved && <p style={{ fontSize: "12px", color: "#22c55e", marginBottom: "4px" }}>✓ Saved</p>}
                  {u.specialisation ? (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {u.specialisation.split(",").map((tag: string) => tag.trim()).filter(Boolean).map((tag: string) => (
                        <span key={tag} style={{ fontSize: "12px", padding: "3px 10px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "999px", color: "#6366f1" }}>{tag}</span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: "13px", color: "var(--color-text-muted)", fontStyle: "italic" }}>No specialisation added yet — click Edit to add one.</p>
                  )}
                </div>
              )}
            </div>

            {/* Meta */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Joined</span>
                <span style={{ color: "var(--color-text-secondary)" }}>{new Date(u.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Last active</span>
                <span style={{ color: "var(--color-text-secondary)" }}>{u.lastActiveAt ? timeAgo(u.lastActiveAt) : "Never"}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function StaffDirectoryPage({ role, title, subtitle }: StaffDirectoryPageProps) {
  const [users, setUsers]           = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [inviteOpen,  setInviteOpen]  = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; email: string } | null>(null);
  const [profileId, setProfileId]   = useState<string | null>(null);
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

  const deleteUser = async () => {
    if (!deleteTarget) return;
    await apiClient.delete(`/admin/users/${deleteTarget.id}`);
    setDeleteTarget(null);
    load();
  };

  const isReviewer = role === "REVIEWER";
  const headers = isReviewer
    ? ["Name", "Email", "Specialisation", "Status", "Joined", "Last active", ""]
    : ["Name", "Email", "Status", "Joined", "Last active", ""];

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
          <Table headers={headers}>
            {filtered.map((u) => {
              const baseActions = (
                <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                  {isReviewer && (
                    <Btn label="Profile" onClick={() => setProfileId(u.id)} variant="ghost" small />
                  )}
                  {u.accountStatus === "ACTIVE" && (
                    <Btn label="Suspend" onClick={() => toggleStatus(u.id, u.accountStatus)} variant="danger" small />
                  )}
                  {u.accountStatus === "SUSPENDED" && (
                    <Btn label="Reactivate" onClick={() => toggleStatus(u.id, u.accountStatus)} variant="ghost" small />
                  )}
                  {u.accountStatus === "PENDING" && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "3px 10px",
                      borderRadius: "var(--radius-pill)",
                      background: "rgba(148,163,184,0.12)",
                      border: "1px solid rgba(148,163,184,0.3)",
                      color: "var(--color-text-muted)",
                      letterSpacing: "0.03em", whiteSpace: "nowrap",
                    }}>✉ Awaiting sign-up</span>
                  )}
                  <Btn
                    label="Delete"
                    onClick={() => setDeleteTarget({
                      id: u.id,
                      name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email,
                      email: u.email,
                    })}
                    variant="danger"
                    small
                  />
                </div>
              );

              const specCell = isReviewer ? (
                u.specialisation ? (
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {u.specialisation.split(",").map((t: string) => t.trim()).filter(Boolean).slice(0, 2).map((tag: string) => (
                      <span key={tag} style={{ fontSize: "11px", padding: "2px 8px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "999px", color: "#6366f1", whiteSpace: "nowrap" }}>{tag}</span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontStyle: "italic" }}>Not set</span>
                )
              ) : null;

              const cols = isReviewer
                ? [
                    <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}</span>,
                    u.email,
                    specCell,
                    statusBadge(u.accountStatus),
                    new Date(u.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }),
                    u.lastActiveAt ? timeAgo(u.lastActiveAt) : "Never",
                    baseActions,
                  ]
                : [
                    <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}</span>,
                    u.email,
                    statusBadge(u.accountStatus),
                    new Date(u.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }),
                    u.lastActiveAt ? timeAgo(u.lastActiveAt) : "Never",
                    baseActions,
                  ];

              return (
                <TableRow
                  key={u.id}
                  cols={cols}
                  onClick={isReviewer ? () => setProfileId(u.id) : undefined}
                />
              );
            })}
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

      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteUser}
        name={deleteTarget?.name ?? ""}
        email={deleteTarget?.email ?? ""}
      />

      {profileId && isReviewer && (
        <ReviewerProfileDrawer
          userId={profileId}
          onClose={() => setProfileId(null)}
        />
      )}
    </div>
  );
}
