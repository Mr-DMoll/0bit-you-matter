"use client";

import { useState, useEffect, useRef } from "react";
import { Edit2, LogOut, Check, X, Camera, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/client";

const T = {
  primary:   "#5B4FCF",
  secondary: "#EEE9FF",
  coral:     "#F97066",
  teal:      "#0D9488",
  sidebar:   "#1E1875",
  bg:        "#FAFAF9",
  card:      "#FFFFFF",
  fg:        "#1A1535",
  muted:     "#7A7499",
  border:    "rgba(91,79,207,0.12)",
};

const SA_PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
  "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape",
];

const SA_SUBJECTS = [
  "Mathematics",
  "Mathematical Literacy",
  "English Home Language",
  "English First Additional Language",
  "Afrikaans Home Language",
  "Afrikaans First Additional Language",
  "isiZulu Home Language",
  "isiZulu First Additional Language",
  "Life Orientation",
  "Life Sciences",
  "Physical Sciences",
  "Geography",
  "History",
  "Accounting",
  "Business Studies",
  "Economics",
  "Information Technology",
  "Computer Applications Technology",
  "Engineering Graphics & Design",
  "Agricultural Sciences",
  "Consumer Studies",
  "Tourism",
  "Visual Arts",
  "Music",
  "Dramatic Arts",
];

const RIASEC_COLOR: Record<string, string> = {
  R: "#ef4444", I: "#3b82f6", A: "#f59e0b",
  S: "#22c55e", E: "#8b5cf6", C: "#f97316",
};
const RIASEC_LABEL: Record<string, string> = {
  R: "Realistic", I: "Investigative", A: "Artistic",
  S: "Social",    E: "Enterprising",  C: "Conventional",
};

// Calculate profile completion based on filled fields
function calcCompletion(user: any, profile: any): { pct: number; missing: string[] } {
  const checks: [boolean, string][] = [
    [!!user?.firstName,   "First name"],
    [!!user?.grade,       "Grade"],
    [!!user?.province,    "Province"],
    [!!user?.school,      "School"],
    [Array.isArray(profile?.subjects) && profile.subjects.length > 0, "Subjects"],
    [!!profile?.chosenCareerId || (profile?.careerMatches?.length > 0), "Career interest"],
  ];
  const done    = checks.filter(([ok]) => ok).length;
  const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
  return { pct: Math.round((done / checks.length) * 100), missing };
}

function Avatar({
  src, initials, size = 72, onUpload,
}: { src?: string | null; initials: string; size?: number; onUpload?: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hovered, setHovered] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      onUpload?.(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0, cursor: onUpload ? "pointer" : "default" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onUpload && inputRef.current?.click()}
    >
      {src ? (
        <img
          src={src}
          alt="Profile"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: `2px solid ${T.border}` }}
        />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: "50%",
          background: `linear-gradient(135deg, ${T.primary}, #7C3AED)`,
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.3, fontWeight: 700,
        }}>
          {initials}
        </div>
      )}
      {onUpload && hovered && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: "rgba(0,0,0,0.45)", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 3,
        }}>
          <Camera size={size * 0.22} color="#fff" />
          <span style={{ fontSize: 9, color: "#fff", fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>
            Change<br />photo
          </span>
        </div>
      )}
      {onUpload && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFile}
        />
      )}
    </div>
  );
}

function InlineEdit({
  label, value, type = "text", options, onSave,
}: {
  label: string;
  value: string | number | null | undefined;
  type?: "text" | "number" | "select";
  options?: string[];
  onSave: (val: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(String(value ?? ""));
  const [saving,  setSaving]  = useState(false);

  const open  = () => { setDraft(String(value ?? "")); setEditing(true); };
  const close = () => setEditing(false);

  const save = async () => {
    setSaving(true);
    try { await onSave(draft); setEditing(false); }
    finally { setSaving(false); }
  };

  const display = value != null && value !== "" ? String(value) : (
    <span style={{ color: T.muted, fontStyle: "italic", fontSize: 12 }}>Not set</span>
  );

  if (!editing) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
        <span style={{ fontSize: 13, color: T.muted, minWidth: 110 }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: T.fg }}>{display}</span>
          <button
            onClick={open}
            style={{ background: "none", border: "none", cursor: "pointer", color: T.primary, padding: "2px 4px", borderRadius: 4, display: "flex", alignItems: "center" }}
          >
            <Edit2 size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${T.border}`, gap: 8 }}>
      <span style={{ fontSize: 13, color: T.muted, minWidth: 110 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "flex-end" }}>
        {type === "select" && options ? (
          <select
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            style={{ fontSize: 13, padding: "4px 8px", border: `1.5px solid ${T.primary}`, borderRadius: 6, outline: "none", background: T.card, color: T.fg }}
          >
            <option value="">Select…</option>
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") close(); }}
            style={{
              fontSize: 13, padding: "4px 8px", border: `1.5px solid ${T.primary}`,
              borderRadius: 6, outline: "none", background: T.card, color: T.fg,
              width: type === "number" ? 70 : 160,
            }}
          />
        )}
        <button
          onClick={save}
          disabled={saving}
          style={{ background: T.primary, border: "none", borderRadius: 6, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <Check size={12} color="#fff" />
        </button>
        <button
          onClick={close}
          style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <X size={12} color={T.muted} />
        </button>
      </div>
    </div>
  );
}

// ─── Subjects editor ─────────────────────────────────────────────────────────
function SubjectsEditor({
  subjects,
  onSave,
}: {
  subjects: Array<{ subject: string; mark?: number | null }>;
  onSave: (subjects: Array<{ subject: string; mark?: number | null }>) => Promise<void>;
}) {
  const [draft,   setDraft]   = useState(subjects.map((s) => ({ ...s })));
  const [adding,  setAdding]  = useState(false);
  const [newSub,  setNewSub]  = useState("");
  const [saving,  setSaving]  = useState(false);
  const [dirty,   setDirty]   = useState(false);

  // Keep draft in sync when parent updates (e.g. after load)
  useEffect(() => {
    setDraft(subjects.map((s) => ({ ...s })));
    setDirty(false);
  }, [subjects]);

  const addSubject = () => {
    if (!newSub) return;
    if (draft.some((s) => s.subject === newSub)) return; // no duplicates
    setDraft([...draft, { subject: newSub }]);
    setNewSub("");
    setAdding(false);
    setDirty(true);
  };

  const removeSubject = (subject: string) => {
    setDraft((prev) => prev.filter((s) => s.subject !== subject));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try { await onSave(draft); setDirty(false); }
    finally { setSaving(false); }
  };

  const available = SA_SUBJECTS.filter((s) => !draft.some((d) => d.subject === s));

  return (
    <div style={{ paddingTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>Subjects</span>
        {dirty && (
          <button
            onClick={save}
            disabled={saving}
            style={{
              fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 8,
              background: T.primary, color: "#fff", border: "none", cursor: "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving…" : "Save subjects"}
          </button>
        )}
      </div>

      {/* Subject chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: draft.length > 0 ? 10 : 0 }}>
        {draft.map(({ subject }) => (
          <div
            key={subject}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: T.secondary, borderRadius: 99, padding: "4px 8px 4px 12px",
              border: `1px solid ${T.primary}28`,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: T.fg }}>{subject}</span>
            <button
              onClick={() => removeSubject(subject)}
              style={{
                background: "none", border: "none", cursor: "pointer", lineHeight: 1,
                color: T.muted, fontSize: 14, padding: "0 2px",
              }}
              title={`Remove ${subject}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add subject row */}
      {adding ? (
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
          <select
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
            autoFocus
            style={{
              fontSize: 13, padding: "5px 10px", border: `1.5px solid ${T.primary}`,
              borderRadius: 8, outline: "none", background: T.card, color: T.fg, flex: 1, minWidth: 180,
            }}
          >
            <option value="">Select subject…</option>
            {available.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={addSubject}
            style={{
              fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 8,
              background: T.primary, color: "#fff", border: "none", cursor: "pointer",
            }}
          >
            Add
          </button>
          <button
            onClick={() => { setAdding(false); setNewSub(""); }}
            style={{
              fontSize: 12, padding: "5px 10px", borderRadius: 8,
              background: "none", border: `1px solid ${T.border}`, color: T.muted, cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{
            marginTop: 6, fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 8,
            background: "none", border: `1.5px dashed ${T.primary}40`, color: T.primary, cursor: "pointer",
          }}
        >
          + Add subject
        </button>
      )}
    </div>
  );
}

export function MyProfilePage() {
  const router = useRouter();
  const [user,    setUser]    = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [flashMsg,    setFlashMsg]    = useState("");

  const flash = (msg: string) => {
    setFlashMsg(msg);
    setTimeout(() => setFlashMsg(""), 2500);
  };

  useEffect(() => {
    Promise.all([
      apiClient.get("/users/me").then((r) => r.data.data.user),
      apiClient.get("/learner/profile").then((r) => r.data.data).catch(() => null),
    ]).then(([u, p]) => {
      setUser(u);
      setProfile(p);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const patchUser = async (fields: Record<string, any>) => {
    const r = await apiClient.patch("/users/me", fields);
    setUser(r.data.data.user);
    flash("Saved ✓");
  };

  const patchProfile = async (fields: Record<string, any>) => {
    const r = await apiClient.patch("/learner/profile", fields);
    setProfile(r.data.data);
    flash("Saved ✓");
  };

  const handleAvatarUpload = async (dataUrl: string) => {
    setPhotoSaving(true);
    try {
      await patchUser({ avatarUrl: dataUrl });
    } finally {
      setPhotoSaving(false);
    }
  };

  const handleLogout = async () => {
    try { await apiClient.post("/auth/logout"); } catch {}
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 14 }}>
        Loading profile…
      </div>
    );
  }

  const fullName   = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.displayName || user?.email || "Learner";
  const initials   = fullName.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
  const { pct, missing } = calcCompletion(user, profile);

  const savedCareers  = profile?.savedCareers ?? [];
  const careerMatches = profile?.careerMatches ?? [];
  const subjects: any[] = Array.isArray(profile?.subjects) ? profile.subjects : [];

  const riasecCode   = profile?.riasecType ?? "";
  const riasecCodes  = riasecCode ? riasecCode.split("") : [];

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px 48px", fontFamily: "inherit" }}>

      {/* Flash toast */}
      {flashMsg && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: "#166534", color: "#fff", borderRadius: 10,
          padding: "10px 18px", fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}>
          {flashMsg}
        </div>
      )}

      {/* Profile hero */}
      <div style={{
        background: T.card, borderRadius: 16, padding: 24,
        border: `1px solid ${T.border}`, marginBottom: 20,
        display: "flex", alignItems: "center", gap: 20,
      }}>
        <div style={{ position: "relative" }}>
          <Avatar
            src={user?.avatarUrl}
            initials={initials}
            size={72}
            onUpload={handleAvatarUpload}
          />
          {photoSaving && (
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "rgba(91,79,207,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ width: 18, height: 18, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "block" }} />
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 700, color: T.fg }}>{fullName}</h2>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: T.muted }}>
            {user?.grade ? `Grade ${user.grade}` : ""}
            {user?.grade && user?.province ? " · " : ""}
            {user?.province ?? ""}
            {!user?.grade && !user?.province && "Set your grade and province below"}
          </p>

          {/* Completion bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: T.muted }}>Profile completion</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 80 ? T.teal : T.primary }}>{pct}%</span>
            </div>
            <div style={{ height: 6, background: T.secondary, borderRadius: 99 }}>
              <div style={{
                width: `${pct}%`, height: "100%", borderRadius: 99,
                background: pct >= 80 ? T.teal : T.primary,
                transition: "width 0.4s ease",
              }} />
            </div>
            {missing.length > 0 && pct < 100 && (
              <p style={{ margin: "6px 0 0", fontSize: 11, color: T.muted }}>
                Still needed: {missing.join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* About You */}
        <div style={{ background: T.card, borderRadius: 16, padding: "16px 20px", border: `1px solid ${T.border}` }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: T.fg }}>About You</h3>

          <InlineEdit
            label="First name"
            value={user?.firstName}
            onSave={(v) => patchUser({ firstName: v })}
          />
          <InlineEdit
            label="Last name"
            value={user?.lastName}
            onSave={(v) => patchUser({ lastName: v })}
          />
          <InlineEdit
            label="Grade"
            value={user?.grade}
            type="number"
            onSave={(v) => patchUser({ grade: v })}
          />
          <InlineEdit
            label="Province"
            value={user?.province}
            type="select"
            options={SA_PROVINCES}
            onSave={(v) => patchUser({ province: v })}
          />
          <InlineEdit
            label="School"
            value={user?.school}
            onSave={(v) => patchUser({ school: v })}
          />

          {/* RIASEC personality type */}
          {riasecCodes.length > 0 && (
            <div style={{ padding: "10px 0 4px" }}>
              <span style={{ fontSize: 13, color: T.muted, display: "block", marginBottom: 8 }}>Personality type (RIASEC)</span>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {riasecCodes.map((code: string) => (
                  <span
                    key={code}
                    title={RIASEC_LABEL[code]}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                      background: (RIASEC_COLOR[code] ?? "#6366f1") + "15",
                      color: RIASEC_COLOR[code] ?? "#6366f1",
                      border: `1.5px solid ${(RIASEC_COLOR[code] ?? "#6366f1") + "40"}`,
                    }}
                  >
                    <span style={{
                      width: 18, height: 18, borderRadius: "50%", fontSize: 10, fontWeight: 800,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      background: (RIASEC_COLOR[code] ?? "#6366f1") + "25",
                    }}>{code}</span>
                    {RIASEC_LABEL[code]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Subjects — always editable */}
          <SubjectsEditor
            subjects={subjects}
            onSave={(subs) => patchProfile({ subjects: subs })}
          />
        </div>

        {/* Career Goals */}
        <div style={{ background: T.card, borderRadius: 16, padding: "16px 20px", border: `1px solid ${T.border}` }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: T.fg }}>Career Goals</h3>

          {savedCareers.length > 0 ? (
            <div style={{ marginBottom: 14 }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: T.muted }}>Saved careers</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {savedCareers.map((sc: any) => (
                  <span
                    key={sc.id}
                    onClick={() => sc.career?.slug && router.push(`/learner/explore/${sc.career.slug}`)}
                    style={{
                      fontSize: 12, fontWeight: 600, background: T.secondary, color: T.primary,
                      borderRadius: 99, padding: "4px 14px", cursor: sc.career?.slug ? "pointer" : "default",
                    }}
                  >
                    {sc.career?.title ?? "—"}
                  </span>
                ))}
              </div>
            </div>
          ) : careerMatches.length > 0 ? (
            <div style={{ marginBottom: 14 }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: T.muted }}>Top career matches</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {careerMatches.slice(0, 3).map((m: any) => (
                  <div
                    key={m.id}
                    onClick={() => m.career?.slug && router.push(`/learner/explore/${m.career.slug}`)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 12px", borderRadius: 10, border: `1px solid ${T.border}`,
                      background: T.bg, cursor: m.career?.slug ? "pointer" : "default",
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.fg }}>{m.career?.title}</p>
                      {m.career?.cluster?.name && (
                        <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{m.career.cluster.name}</p>
                      )}
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: 700, borderRadius: 99,
                      padding: "3px 10px",
                      background: m.matchPercentage >= 80 ? "rgba(22,101,52,0.1)" : "rgba(91,79,207,0.1)",
                      color: m.matchPercentage >= 80 ? "#166534" : T.primary,
                    }}>
                      {Math.round(m.matchPercentage)}% match
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: T.muted, margin: "0 0 14px" }}>
              No saved careers yet. <span onClick={() => router.push("/learner/explore")} style={{ color: T.primary, cursor: "pointer", fontWeight: 600 }}>Explore careers →</span>
            </p>
          )}

          {profile?.chosenCareerId && (
            <div style={{ padding: "8px 0", borderTop: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: T.muted }}>Chosen career path</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: T.fg }}>
                  {careerMatches.find((m: any) => m.career?.id === profile.chosenCareerId)?.career?.title
                    ?? savedCareers.find((sc: any) => sc.career?.id === profile.chosenCareerId)?.career?.title
                    ?? "Set"}
                </span>
              </div>
            </div>
          )}

          {profile?.studyProvincePreference && (
            <div style={{ padding: "8px 0", borderTop: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: T.muted }}>Study preference</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: T.fg }}>{profile.studyProvincePreference}</span>
              </div>
            </div>
          )}

          {!savedCareers.length && !careerMatches.length && (
            <button
              onClick={() => router.push("/learner/explore")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 18px", borderRadius: 10, border: `1.5px solid ${T.primary}`,
                background: "transparent", color: T.primary, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              Explore Careers →
            </button>
          )}
        </div>

        {/* Account */}
        <div style={{ background: T.card, borderRadius: 16, padding: "16px 20px", border: `1px solid ${T.border}` }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: T.fg }}>Account</h3>

          <div style={{ padding: "9px 0", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: T.muted }}>Email</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: T.fg }}>{user?.email ?? "—"}</span>
          </div>

          <div style={{ padding: "9px 0", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: T.muted }}>Joined</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: T.fg }}>
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-ZA", { month: "long", year: "numeric" })
                : "—"}
            </span>
          </div>

          {/* Photo upload hint */}
          <div style={{
            marginTop: 14, padding: "10px 14px", borderRadius: 10,
            background: T.secondary, display: "flex", alignItems: "center", gap: 10,
          }}>
            <Upload size={15} color={T.primary} />
            <p style={{ margin: 0, fontSize: 12, color: T.primary, fontWeight: 500 }}>
              Click your profile photo to upload a new image from your device.
            </p>
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              onClick={handleLogout}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "#FEE2E2", color: T.coral, border: "none",
                borderRadius: 10, padding: "10px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
