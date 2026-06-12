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
  // Core languages
  "English Home Language",
  "English First Additional Language",
  "Afrikaans Home Language",
  "Afrikaans First Additional Language",
  // SA languages
  "isiZulu Home Language",
  "isiZulu First Additional Language",
  "isiXhosa Home Language",
  "isiXhosa First Additional Language",
  "Sesotho Home Language",
  "Sesotho First Additional Language",
  "Setswana Home Language",
  "Setswana First Additional Language",
  "Sepedi Home Language",
  "Sepedi First Additional Language",
  "Tshivenda Home Language",
  "Tshivenda First Additional Language",
  "Xitsonga Home Language",
  "Xitsonga First Additional Language",
  "SiSwati Home Language",
  "SiSwati First Additional Language",
  "isiNdebele Home Language",
  "isiNdebele First Additional Language",
  // Mathematics
  "Mathematics",
  "Mathematical Literacy",
  "Technical Mathematics",
  // Sciences
  "Life Sciences",
  "Physical Sciences",
  "Technical Sciences",
  // Social & Commercial
  "Accounting",
  "Business Studies",
  "Economics",
  "History",
  "Geography",
  // Technology
  "Information Technology",
  "Computer Applications Technology",
  "Engineering Graphics & Design",
  // Arts & other
  "Visual Arts",
  "Music",
  "Dramatic Arts",
  "Consumer Studies",
  "Tourism",
  "Agricultural Sciences",
  "Life Orientation",
  "Religion Studies",
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
  const isGrade9 = parseInt(user?.grade ?? "0") === 9;
  const checks: [boolean, string][] = [
    [!!user?.firstName,   "First name"],
    [!!user?.grade,       "Grade"],
    [!!user?.province,    "Province"],
    [!!user?.school,      "School"],
    // Grade 9 learners don't add subjects — count as complete
    [isGrade9 || (Array.isArray(profile?.subjects) && profile.subjects.length > 0), "Subjects"],
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
      const img = new Image();
      img.onload = () => {
        // Resize to max 256×256 before sending — keeps payload well under 100kb
        const MAX = 256;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        onUpload?.(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = ev.target?.result as string;
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

// ─── Grade 9 subject guide ────────────────────────────────────────────────────

const STREAM_SUBJECTS: Record<string, { stream: string; icon: string; color: string; core: string[]; optional: string[] }> = {
  R: {
    stream: "Science & Technology",
    icon: "🔬", color: "#2563EB",
    core:     ["Mathematics", "Physical Sciences", "Life Sciences"],
    optional: ["Information Technology", "Technical Sciences", "Geography"],
  },
  I: {
    stream: "Science & Technology",
    icon: "🔬", color: "#2563EB",
    core:     ["Mathematics", "Physical Sciences", "Information Technology"],
    optional: ["Life Sciences", "Technical Mathematics", "Geography"],
  },
  A: {
    stream: "Arts & Humanities",
    icon: "🎨", color: "#7C3AED",
    core:     ["English Home Language", "Visual Arts", "History"],
    optional: ["Dramatic Arts", "Music", "isiZulu Home Language", "Afrikaans First Additional Language"],
  },
  S: {
    stream: "Social Sciences",
    icon: "🤝", color: "#0D9488",
    core:     ["Life Sciences", "History", "Geography"],
    optional: ["English Home Language", "Religion Studies", "Economics"],
  },
  E: {
    stream: "Commerce & Business",
    icon: "💼", color: "#D97706",
    core:     ["Mathematics", "Accounting", "Business Studies"],
    optional: ["Economics", "Information Technology", "English First Additional Language"],
  },
  C: {
    stream: "Commerce & Business",
    icon: "💼", color: "#D97706",
    core:     ["Mathematics", "Accounting", "Business Studies"],
    optional: ["Economics", "Mathematical Literacy", "Information Technology"],
  },
};

function Grade9SubjectGuide({ riasecType }: { riasecType: string }) {
  const topCode = riasecType?.[0] ?? "";
  const data    = STREAM_SUBJECTS[topCode];

  if (!data) return (
    <div style={{ padding: "12px 0" }}>
      <p style={{ margin: 0, fontSize: 13, color: T.muted }}>
        Complete the Interest Assessment to see which subjects we recommend for you.
      </p>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>{data.icon}</span>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.fg }}>{data.stream} stream</p>
          <p style={{ margin: 0, fontSize: 11, color: T.muted }}>Recommended based on your RIASEC type ({riasecType})</p>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: data.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Core subjects to choose in Grade 10
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {data.core.map((s) => (
            <span key={s} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 8, background: data.color + "15", color: data.color, fontWeight: 600 }}>
              ✓ {s}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Also useful
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {data.optional.map((s) => (
            <span key={s} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 8, background: T.secondary, color: T.muted, fontWeight: 500 }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      <p style={{ margin: "12px 0 0", fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
        You&apos;ll add your actual subjects once you&apos;re in Grade 10 and have chosen them with your school.
      </p>
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
      <span style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>Subjects</span>

      {/* Subject chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 8, marginBottom: draft.length > 0 ? 10 : 0 }}>
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

      {/* Add subject row — when adding, show select + Add + Cancel */}
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
        /* Bottom row: "+ Add subject" always visible, "Save" appears when dirty */
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
          <button
            onClick={() => setAdding(true)}
            style={{
              fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 8,
              background: "none", border: `1.5px dashed ${T.primary}40`, color: T.primary, cursor: "pointer",
            }}
          >
            + Add subject
          </button>
          {dirty && (
            <button
              onClick={save}
              disabled={saving}
              style={{
                fontSize: 12, fontWeight: 700, padding: "5px 16px", borderRadius: 8,
                background: T.primary, color: "#fff", border: "none", cursor: "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          )}
        </div>
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

  const notifyProfileUpdated = () =>
    window.dispatchEvent(new CustomEvent("profile-updated"));

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
    notifyProfileUpdated();
  };

  const patchProfile = async (fields: Record<string, any>) => {
    const r = await apiClient.patch("/learner/profile", fields);
    setProfile(r.data.data);
    flash("Saved ✓");
    notifyProfileUpdated();
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
  const grade        = parseInt(user?.grade ?? "0") || 0;
  const isGrade9     = grade === 9;

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
      <div className="profile-hero" style={{
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
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: T.muted }}>Personality type</span>
                <button
                  onClick={() => router.push("/learner/chat?prompt=" + encodeURIComponent("What does RIASEC mean and how does it help with career choices?"))}
                  style={{ fontSize: 11, fontWeight: 700, color: T.primary, background: T.secondary, border: "none", borderRadius: 99, padding: "2px 10px", cursor: "pointer" }}
                >
                  What is RIASEC? →
                </button>
              </div>

              {/* RIASEC acronym legend */}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                {(["R","I","A","S","E","C"] as const).map((code) => (
                  <span key={code} style={{ fontSize: 11, color: riasecCodes.includes(code) ? (RIASEC_COLOR[code] ?? T.muted) : T.muted, fontWeight: riasecCodes.includes(code) ? 700 : 400, opacity: riasecCodes.includes(code) ? 1 : 0.5 }}>
                    <strong>{code}</strong>={RIASEC_LABEL[code]}{code !== "C" ? "  " : ""}
                  </span>
                ))}
              </div>

              {/* Clickable chips — each opens chat with a personalised question */}
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {riasecCodes.map((code: string) => (
                  <button
                    key={code}
                    onClick={() => router.push("/learner/chat?prompt=" + encodeURIComponent(`Tell me more about the ${RIASEC_LABEL[code]} (${code}) personality type in RIASEC and what careers suit it.`))}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                      background: (RIASEC_COLOR[code] ?? "#6366f1") + "15",
                      color: RIASEC_COLOR[code] ?? "#6366f1",
                      border: `1.5px solid ${(RIASEC_COLOR[code] ?? "#6366f1") + "40"}`,
                      cursor: "pointer",
                    }}
                    title="Tap to learn more about this type"
                  >
                    <span style={{
                      width: 18, height: 18, borderRadius: "50%", fontSize: 10, fontWeight: 800,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      background: (RIASEC_COLOR[code] ?? "#6366f1") + "25",
                    }}>{code}</span>
                    {RIASEC_LABEL[code]}
                    <span style={{ fontSize: 10, opacity: 0.6 }}>?</span>
                  </button>
                ))}
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: T.muted }}>Tap a type to ask your Career Guide what it means for you.</p>
            </div>
          )}

          {/* Subjects — hidden for Grade 9; replaced with stream subject guide */}
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: T.muted }}>
              {isGrade9 ? "Recommended subjects" : "Subjects"}
            </p>
            {isGrade9
              ? <Grade9SubjectGuide riasecType={riasecCode} />
              : <SubjectsEditor subjects={subjects} onSave={(subs) => patchProfile({ subjects: subs })} />
            }
          </div>
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
        @media (max-width: 480px) {
          .profile-hero { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>
    </div>
  );
}
