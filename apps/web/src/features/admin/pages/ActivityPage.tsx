"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";

// ── Category detection ────────────────────────────────────────────────────────
type Category = "auth" | "learner" | "assessment" | "chat" | "content" | "admin" | "other";

function detectCategory(action: string): Category {
  const a = action.toUpperCase();
  if (/LOGIN|LOGOUT|REGISTER|PASSWORD|AUTH|REFRESH|SET_PASSWORD/.test(a)) return "auth";
  if (/ASSESSMENT/.test(a))                                                 return "assessment";
  if (/CHAT/.test(a))                                                       return "chat";
  if (/CONTENT|GENERATION|JOB/.test(a))                                     return "content";
  if (/ADMIN|STAFF|INVITE|USER_STATUS|USER_ROLE/.test(a))                   return "admin";
  if (/LEARNER|PROFILE|SAVED|CAREER|ROADMAP|MILESTONE/.test(a))             return "learner";
  return "other";
}

const CATEGORY_META: Record<Category, { label: string; color: string; bg: string; dot: string }> = {
  auth:       { label: "Auth",        color: "#2563EB", bg: "#EFF6FF", dot: "#2563EB" },
  learner:    { label: "Learner",     color: "#16A34A", bg: "#F0FDF4", dot: "#16A34A" },
  assessment: { label: "Assessment",  color: "#7C3AED", bg: "#F5F3FF", dot: "#7C3AED" },
  chat:       { label: "AI Chat",     color: "#5B4FCF", bg: "#EEF2FF", dot: "#5B4FCF" },
  content:    { label: "Content",     color: "#D97706", bg: "#FFFBEB", dot: "#D97706" },
  admin:      { label: "Admin",       color: "#DC2626", bg: "#FEF2F2", dot: "#DC2626" },
  other:      { label: "Other",       color: "#94A3B8", bg: "#F8FAFC", dot: "#94A3B8" },
};

// ── Human-readable labels ─────────────────────────────────────────────────────
// Maps exact action codes → { label, detail extractor }
const ACTION_MAP: Record<string, { label: (m: any) => string; detail?: (m: any) => string | null }> = {
  // Auth
  LOGIN:                             { label: () => "Logged in" },
  LOGOUT:                            { label: () => "Logged out" },
  POST_AUTH_LOGIN:                   { label: () => "Logged in" },
  POST_AUTH_LOGOUT:                  { label: () => "Logged out" },
  POST_AUTH_REGISTER:                { label: () => "Registered an account" },
  POST_AUTH_REFRESH:                 { label: () => "Refreshed session" },
  POST_AUTH_FORGOT_PASSWORD:         { label: () => "Requested password reset" },
  POST_AUTH_RESET_PASSWORD:          { label: () => "Reset their password" },
  POST_AUTH_SET_PASSWORD:            { label: () => "Set account password" },
  // Learner
  PATCH_LEARNER_PROFILE:             { label: () => "Updated their profile" },
  POST_LEARNER_PROFILE:              { label: () => "Created their learner profile" },
  POST_LEARNER_SAVED_CAREERS:        { label: () => "Saved a career" },
  DELETE_LEARNER_SAVED_CAREERS:      { label: () => "Removed a saved career" },
  POST_LEARNER_ROADMAP:              { label: () => "Created a roadmap" },
  POST_LEARNER_MILESTONES:           { label: () => "Added a milestone" },
  PATCH_LEARNER_MILESTONES:          { label: () => "Updated a milestone" },
  // Assessments
  POST_LEARNER_ASSESSMENTS:          { label: () => "Started an assessment" },
  PATCH_LEARNER_ASSESSMENTS:         { label: () => "Answered an assessment question" },
  POST_LEARNER_ASSESSMENTS_COMPLETE: { label: () => "Completed an assessment" },
  ASSESSMENT_COMPLETED:              { label: () => "Completed an assessment" },
  // Chat
  POST_LEARNER_CHAT:                 { label: () => "Sent a career guidance message" },
  PATCH_LEARNER_CHAT_REACTION: {
    label: (m) => {
      if (m?.reaction === "up")   return "Marked a chat reply as helpful 👍";
      if (m?.reaction === "down") return "Marked a chat reply as not helpful 👎";
      return "Reacted to a chat reply";
    },
  },
  // Content
  POST_CAREERS:                      { label: () => "Created a career entry" },
  PATCH_CAREERS:                     { label: () => "Updated a career entry" },
  DELETE_CAREERS:                    { label: () => "Deleted a career entry" },
  POST_CONTENT_JOBS:                 { label: () => "Triggered AI content generation" },
  CONTENT_VERIFIED:                  { label: () => "Verified content" },
  CONTENT_DISCARDED:                 { label: () => "Discarded content" },
  // Admin
  STAFF_INVITED:        { label: (m) => `Invited ${m?.email ?? "a team member"} as ${(m?.role ?? "").replace(/_/g, " ").toLowerCase()}` },
  USER_STATUS_UPDATED:  { label: (m) => `Changed user status to ${m?.status ?? "unknown"}` },
  PATCH_ADMIN_USERS_STATUS: { label: (m) => `Changed user status to ${m?.status ?? "unknown"}` },
  PATCH_ADMIN_USERS_ROLE:   { label: () => "Changed a user's role" },
  DELETE_ADMIN_USERS:       { label: () => "Deleted a user account" },
  POST_ADMIN_STAFF_INVITE:  { label: (m) => `Invited ${m?.email ?? "a team member"}` },
};

function prettifyCode(action: string): string {
  return action
    .replace(/^(GET|POST|PATCH|PUT|DELETE)_/, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolveAction(action: string, meta: any) {
  const cfg      = ACTION_MAP[action];
  const category = detectCategory(action);
  const label    = cfg ? cfg.label(meta) : prettifyCode(action);
  const detail   = cfg?.detail ? cfg.detail(meta) : null;
  return { label, detail, category };
}

// ── Filter chips ──────────────────────────────────────────────────────────────
// apiKeyword is what we send to the API's `action` search (substring match)
const FILTERS = [
  { key: "all",        label: "All",         apiKeyword: "" },
  // Auth explicitly logs "LOGIN", "REGISTERED", "PASSWORD_SET" — no "AUTH" in them
  { key: "auth",       label: "Auth",        apiKeyword: "LOGIN,REGISTERED,PASSWORD,AUTH" },
  // Learner auto-middleware generates PATCH_LEARNER_*, POST_LEARNER_*, DELETE_LEARNER_*
  { key: "learner",    label: "Learners",    apiKeyword: "LEARNER,SAVED_CAREER,PROFILE" },
  // Assessment actions are under learner assessment routes
  { key: "assessment", label: "Assessments", apiKeyword: "ASSESSMENT,SESSION" },
  { key: "chat",       label: "AI Chat",     apiKeyword: "CHAT" },
  { key: "content",    label: "Content",     apiKeyword: "CONTENT,GENERATION,JOB" },
  { key: "admin",      label: "Admin",       apiKeyword: "ADMIN,STAFF,INVITE,USER_STATUS" },
] as const;
type FilterKey = typeof FILTERS[number]["key"];

// ── Helpers ───────────────────────────────────────────────────────────────────
const ROLE_COLOR: Record<string, string> = {
  SUPER_ADMIN: "#DC2626", ADMIN: "#D97706", MANAGER: "#2563EB",
  CONTENT_MANAGER: "#7C3AED", REVIEWER: "#0D9488", LEARNER: "#16A34A",
};

const SA_PROVINCES: Record<string, string> = {
  "Gauteng": "GP", "Western Cape": "WC", "KwaZulu-Natal": "KZN",
  "Eastern Cape": "EC", "Limpopo": "LP", "Mpumalanga": "MP",
  "North West": "NW", "Northern Cape": "NC", "Free State": "FS",
};

function displayName(u: any) {
  return u?.displayName || [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.email || "Unknown";
}

function groupByDate(logs: any[]) {
  const groups: Record<string, any[]> = {};
  logs.forEach((log) => {
    const key = new Date(log.createdAt).toLocaleDateString("en-ZA", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(log);
  });
  return groups;
}

// ── Main component ─────────────────────────────────────────────────────────────
export function AdminActivityPage() {
  const [logs,           setLogs]           = useState<any[]>([]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [isLoadingMore,  setIsLoadingMore]  = useState(false);
  const [page,           setPage]           = useState(1);
  const [hasMore,        setHasMore]        = useState(false);
  const [total,          setTotal]          = useState(0);
  const [textSearch,     setTextSearch]     = useState("");
  const [activeFilter,   setActiveFilter]   = useState<FilterKey>("all");
  const [apiSearch,      setApiSearch]      = useState(""); // actual value sent to API
  const [expanded,       setExpanded]       = useState<Set<string>>(new Set());

  // Debounce text search only
  useEffect(() => {
    const t = setTimeout(() => {
      setApiSearch(textSearch || FILTERS.find((f) => f.key === activeFilter)!.apiKeyword);
    }, 400);
    return () => clearTimeout(t);
  }, [textSearch, activeFilter]);

  const fetchLogs = useCallback(async (p: number, search: string, append = false) => {
    try {
      append ? setIsLoadingMore(true) : setIsLoading(true);
      const params = new URLSearchParams({ page: String(p) });
      if (search) params.set("action", search);
      const { data } = await apiClient.get(`/admin/activity?${params}`);
      const newLogs  = data.data?.logs ?? [];
      setLogs((prev) => append ? [...prev, ...newLogs] : newLogs);
      setTotal(data.data?.pagination?.total ?? 0);
      setHasMore(p < (data.data?.pagination?.pages ?? 1));
      setPage(p);
    } catch { /* silent */ }
    finally { setIsLoading(false); setIsLoadingMore(false); }
  }, []);

  useEffect(() => { fetchLogs(1, apiSearch); }, [apiSearch]);

  const handleFilterClick = (f: typeof FILTERS[number]) => {
    setActiveFilter(f.key);
    setTextSearch("");           // clear text box
    setApiSearch(f.apiKeyword);  // send immediately (no debounce needed)
  };

  const handleTextSearch = (val: string) => {
    setTextSearch(val);
    setActiveFilter("all"); // deselect chip when typing
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 80, color: "var(--color-text-muted)" }}>
      <div style={{ width: 16, height: 16, border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <span style={{ fontSize: 13 }}>Loading activity…</span>
    </div>
  );

  const grouped = groupByDate(logs);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Activity Log</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "3px 0 0" }}>Full audit log — all platform actions</p>
        </div>
        {total > 0 && (
          <span style={{ fontSize: 12, color: "var(--color-text-muted)", padding: "5px 12px", background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-md)" }}>
            {total.toLocaleString()} total actions
          </span>
        )}
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {FILTERS.map((f) => {
          const on = activeFilter === f.key;
          const meta = f.key !== "all" ? CATEGORY_META[f.key as Category] : null;
          return (
            <button
              key={f.key}
              onClick={() => handleFilterClick(f)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 14px", fontSize: 12, fontWeight: on ? 700 : 500,
                borderRadius: 999, cursor: "pointer",
                border: `1px solid ${on ? (meta?.color ?? "var(--color-accent)") : "var(--color-border)"}`,
                background: on ? (meta?.color ?? "var(--color-accent)") : "var(--color-card-bg)",
                color: on ? "#fff" : "var(--color-text-muted)",
                transition: "all 0.15s",
              }}
            >
              {meta && !on && (
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: meta.dot, flexShrink: 0 }} />
              )}
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <input
        type="text"
        value={textSearch}
        onChange={(e) => handleTextSearch(e.target.value)}
        placeholder="Search by action (e.g. LOGIN, ASSESSMENT, CHAT, CAREER)…"
        style={{
          width: "100%", padding: "9px 14px", background: "var(--color-card-bg)",
          border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-md)",
          fontSize: 13, color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box",
        }}
      />

      {/* Color legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {(Object.entries(CATEGORY_META) as [Category, typeof CATEGORY_META[Category]][])
          .filter(([k]) => k !== "other")
          .map(([key, meta]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: meta.dot }} />
              <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{meta.label}</span>
            </div>
          ))}
      </div>

      {/* Log list */}
      {logs.length === 0 ? (
        <div style={{ padding: "60px 40px", textAlign: "center", background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-lg)" }}>
          <p style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 6 }}>
            {textSearch || activeFilter !== "all" ? "No matching actions" : "No activity yet"}
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            {activeFilter !== "all" ? `No ${FILTERS.find(f => f.key === activeFilter)?.label} actions recorded yet.` : "Actions will appear here as they happen."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {Object.entries(grouped).map(([date, dayLogs]) => (
            <div key={date}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap", margin: 0 }}>{date}</p>
                <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
                <span style={{ fontSize: 11, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{dayLogs.length} events</span>
              </div>

              <div style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                {dayLogs.map((log: any, i: number) => {
                  const { label, detail, category } = resolveAction(log.action, log.meta);
                  const catMeta    = CATEGORY_META[category];
                  const roleColor  = ROLE_COLOR[log.user?.role] ?? "#94A3B8";
                  const isExpanded = expanded.has(log.id);
                  const province   = log.user?.province;
                  const provCode   = province ? (SA_PROVINCES[province] ?? province.slice(0, 3).toUpperCase()) : null;

                  return (
                    <div key={log.id}>
                      <div
                        onClick={() => toggleExpanded(log.id)}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: 14,
                          padding: "13px 20px",
                          borderBottom: (i < dayLogs.length - 1 || isExpanded) ? "1px solid var(--color-border)" : "none",
                          cursor: "pointer",
                          background: isExpanded ? catMeta.bg : "transparent",
                          transition: "background 0.15s",
                        }}
                      >
                        {/* Category dot */}
                        <div style={{
                          width: 10, height: 10, borderRadius: "50%",
                          background: catMeta.dot, flexShrink: 0, marginTop: 4,
                          boxShadow: `0 0 0 3px ${catMeta.dot}20`,
                        }} />

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
                              background: catMeta.bg, color: catMeta.color,
                              border: `1px solid ${catMeta.color}30`,
                              textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0,
                            }}>
                              {catMeta.label}
                            </span>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{label}</p>
                          </div>
                          {detail && <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "2px 0 0" }}>{detail}</p>}
                          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 4, flexWrap: "wrap" }}>
                            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0, fontWeight: 600 }}>{displayName(log.user)}</p>
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 999,
                              background: `${roleColor}15`, color: roleColor, textTransform: "uppercase",
                            }}>
                              {log.user?.role?.replace(/_/g, " ")}
                            </span>
                            {provCode && (
                              <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 999, background: "#E0E7FF", color: "#4338CA" }}>
                                {provCode}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Time */}
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
                            {new Date(log.createdAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: "3px 0 0", opacity: 0.4 }}>
                            {isExpanded ? "▲" : "▼"}
                          </p>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div style={{
                          padding: "12px 20px 12px 44px",
                          borderBottom: i < dayLogs.length - 1 ? "1px solid var(--color-border)" : "none",
                          background: catMeta.bg,
                          display: "flex", flexWrap: "wrap", gap: "10px 28px",
                        }}>
                          {[
                            { k: "Action code", v: log.action },
                            { k: "Email",       v: log.user?.email },
                            { k: "Province",    v: log.user?.province },
                            { k: "School",      v: log.user?.school },
                            ...(log.meta && typeof log.meta === "object"
                              ? Object.entries(log.meta)
                                  .filter(([mk]) => !["path", "method", "status"].includes(mk))
                                  .map(([mk, mv]) => ({ k: mk, v: String(mv) }))
                              : []),
                          ].filter((x) => x.v).map(({ k, v }) => (
                            <div key={k}>
                              <p style={{ fontSize: 10, fontWeight: 700, color: catMeta.color, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>{k}</p>
                              <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0, fontFamily: k === "Action code" ? "monospace" : "inherit" }}>{v}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {hasMore && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                onClick={() => fetchLogs(page + 1, apiSearch, true)}
                disabled={isLoadingMore}
                style={{
                  padding: "9px 24px", fontSize: 13, fontWeight: 500,
                  background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)",
                  borderRadius: "var(--radius-md)", cursor: "pointer",
                  color: "var(--color-text-secondary)", opacity: isLoadingMore ? 0.6 : 1,
                }}
              >
                {isLoadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
