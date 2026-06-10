"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/client";
import {
  PageHeader, Card, Select, Btn,
} from "@/features/admin/components/AdminShell";

const CONTENT_TYPES = [
  { label: "Career",               value: "CAREER" },
  { label: "University Programme", value: "UNIVERSITY_PROGRAMME" },
  { label: "Bursary",              value: "BURSARY" },
  { label: "Assessment Question",  value: "ASSESSMENT_QUESTION" },
];

const ASSESSMENT_TYPES = [
  { label: "Interest",    value: "INTEREST" },
  { label: "Aptitude",    value: "APTITUDE" },
  { label: "Personality", value: "PERSONALITY" },
  { label: "Values",      value: "VALUES" },
];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "6px" }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: "100%", padding: "8px 12px", fontSize: "13px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }}
    />
  );
}

// ── Per-type parameter forms ───────────────────────────────────────────────────

function CareerParams({ clusters, params, setParams }: { clusters: any[]; params: any; setParams: (p: any) => void }) {
  return (
    <>
      <Field label="Career cluster *" hint="The cluster this career belongs to — improves generation accuracy">
        <Select
          value={params.clusterId ?? ""}
          onChange={(v) => setParams({ ...params, clusterId: v, clusterName: clusters.find(c => c.id === v)?.name })}
          options={[
            { label: "Select a cluster…", value: "" },
            ...clusters.map((c) => ({ label: c.name, value: c.id })),
          ]}
        />
      </Field>
      <Field label="Career title hint" hint="Optional — e.g. 'Software Engineer', 'Paramedic'. Leave blank for AI to choose within the cluster.">
        <Input value={params.title ?? ""} onChange={(v) => setParams({ ...params, title: v })} placeholder="e.g. Data Scientist" />
      </Field>
    </>
  );
}

function UniversityProgrammeParams({ params, setParams }: { params: any; setParams: (p: any) => void }) {
  return (
    <>
      <Field label="University name *" hint="e.g. University of Cape Town, Wits University">
        <Input value={params.university ?? ""} onChange={(v) => setParams({ ...params, university: v })} placeholder="University of Cape Town" />
      </Field>
      <Field label="Programme name *" hint="e.g. BSc Computer Science, BCom Accounting">
        <Input value={params.name ?? ""} onChange={(v) => setParams({ ...params, name: v })} placeholder="BSc Computer Science" />
      </Field>
      <Field label="Faculty" hint="Optional — e.g. Faculty of Science">
        <Input value={params.faculty ?? ""} onChange={(v) => setParams({ ...params, faculty: v })} placeholder="Faculty of Science" />
      </Field>
    </>
  );
}

function BursaryParams({ params, setParams }: { params: any; setParams: (p: any) => void }) {
  return (
    <>
      <Field label="Bursary / funding name *" hint="e.g. Sasol Bursary Programme, NSFAS">
        <Input value={params.name ?? ""} onChange={(v) => setParams({ ...params, name: v })} placeholder="Sasol Bursary Programme" />
      </Field>
      <Field label="Provider / organisation *" hint="The company or government body that offers it">
        <Input value={params.provider ?? ""} onChange={(v) => setParams({ ...params, provider: v })} placeholder="Sasol" />
      </Field>
      <Field label="Sector / field of study" hint="Optional — e.g. Engineering, Health Sciences">
        <Input value={params.sector ?? ""} onChange={(v) => setParams({ ...params, sector: v })} placeholder="Engineering" />
      </Field>
    </>
  );
}

function AssessmentQuestionParams({ params, setParams }: { params: any; setParams: (p: any) => void }) {
  return (
    <Field label="Assessment type *">
      <Select
        value={params.type ?? "INTEREST"}
        onChange={(v) => setParams({ ...params, type: v })}
        options={ASSESSMENT_TYPES}
      />
    </Field>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function GenerateContentPage() {
  const router = useRouter();
  const [clusters, setClusters]       = useState<any[]>([]);
  const [templates, setTemplates]     = useState<any[]>([]);
  const [contentType, setContentType] = useState("CAREER");
  const [templateId, setTemplateId]   = useState("");
  const [params, setParams]           = useState<any>({});
  const [submitting, setSubmitting]   = useState(false);
  const [success, setSuccess]         = useState("");
  const [error, setError]             = useState("");

  useEffect(() => {
    apiClient.get("/careers/clusters").then((r) => setClusters(r.data.data ?? [])).catch(() => {});
    apiClient.get("/content/prompts").then((r) => setTemplates(r.data.data ?? [])).catch(() => {});
  }, []);

  // Reset params when content type changes
  const handleTypeChange = (v: string) => {
    setContentType(v);
    setTemplateId("");
    setParams({});
    setError("");
  };

  const filteredTemplates = templates.filter((t) => t.contentType === contentType && t.isActive);

  const validate = (): string | null => {
    if (contentType === "CAREER" && !params.clusterId) return "Please select a cluster for the career";
    if (contentType === "UNIVERSITY_PROGRAMME" && (!params.university || !params.name)) return "University name and programme name are required";
    if (contentType === "BURSARY" && (!params.name || !params.provider)) return "Bursary name and provider are required";
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setError(""); setSuccess("");
    setSubmitting(true);
    try {
      await apiClient.post("/content/jobs", {
        contentType,
        promptTemplateId: templateId || undefined,
        parameters: params,
      });
      setSuccess("Generation job queued! Check the Generation Queue to track progress.");
      setParams(contentType === "ASSESSMENT_QUESTION" ? { type: "INTEREST" } : {});
      setTemplateId("");
      setTimeout(() => setSuccess(""), 8000);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to queue job");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Generate Content"
        subtitle="Trigger AI content generation — Claude writes the entry, you review and publish"
        action={<Btn label="View queue →" onClick={() => router.push("/content-manager/generation-queue")} variant="ghost" />}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px" }}>
        <Card title="New generation job">
          {success && (
            <div style={{ padding: "10px 14px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#22c55e", marginBottom: "16px" }}>
              ✓ {success}
              <button onClick={() => router.push("/content-manager/generation-queue")} style={{ marginLeft: "8px", background: "none", border: "none", color: "#22c55e", cursor: "pointer", fontSize: "12px", fontWeight: 600, textDecoration: "underline" }}>
                View queue
              </button>
            </div>
          )}
          {error && (
            <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#ef4444", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Field label="Content type *">
              <Select value={contentType} onChange={handleTypeChange} options={CONTENT_TYPES} />
            </Field>

            {/* Smart per-type forms */}
            {contentType === "CAREER"               && <CareerParams clusters={clusters} params={params} setParams={setParams} />}
            {contentType === "UNIVERSITY_PROGRAMME"  && <UniversityProgrammeParams params={params} setParams={setParams} />}
            {contentType === "BURSARY"               && <BursaryParams params={params} setParams={setParams} />}
            {contentType === "ASSESSMENT_QUESTION"   && <AssessmentQuestionParams params={params} setParams={setParams} />}

            <Field label="Prompt template">
              <Select
                value={templateId}
                onChange={setTemplateId}
                options={[
                  { label: "Use default prompt (recommended)", value: "" },
                  ...filteredTemplates.map((t) => ({ label: `${t.name} (v${t.version})`, value: t.id })),
                ]}
              />
              {filteredTemplates.length === 0 && (
                <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                  No custom templates — using built-in SA-optimised prompt
                </p>
              )}
            </Field>

            <div style={{ paddingTop: "4px" }}>
              <Btn label={submitting ? "Queuing…" : "Queue generation job"} onClick={handleSubmit} />
            </div>
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Card title="How it works">
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { step: "1", color: "#6366f1", title: "Job queued",       desc: "Your request goes into the generation queue with the content details you provided." },
                { step: "2", color: "#3b82f6", title: "Claude generates", desc: "The AI agent calls Claude with an SA-optimised prompt and validates the JSON output." },
                { step: "3", color: "#8b5cf6", title: "Entry saved",      desc: "The generated entry is saved to the database with status AI_GENERATED." },
                { step: "4", color: "#f59e0b", title: "Assign for review",desc: "Go to Assign Reviews and send it to a Professional Reviewer." },
                { step: "5", color: "#22c55e", title: "Verify & publish", desc: "After review and data verification, the entry goes live to learners." },
              ].map(({ step, color, title, desc }) => (
                <div key={step} style={{ display: "flex", gap: "12px" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{step}</div>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{title}</p>
                    <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {contentType === "CAREER" && clusters.length > 0 && (
            <Card title="Available clusters">
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {clusters.map((c) => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{c.name}</span>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{c._count?.careers ?? 0} careers</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
