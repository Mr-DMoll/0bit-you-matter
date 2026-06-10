"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, StatCard, Table, TableRow, statusBadge,
  Spinner, Empty, Select, Btn, Pagination, timeAgo, displayName,
} from "../components/AdminShell";

// ── SA careers by cluster slug ────────────────────────────────────────────────

const SA_CAREERS: Record<string, string[]> = {
  "information-technology": [
    "Software Developer", "Data Scientist", "Cybersecurity Analyst", "Network Engineer",
    "UI/UX Designer", "Database Administrator", "Cloud Architect", "DevOps Engineer",
    "IT Project Manager", "Artificial Intelligence Engineer", "Web Developer",
    "Mobile App Developer", "Systems Analyst", "Business Intelligence Analyst",
    "Machine Learning Engineer", "Game Developer", "IT Support Specialist",
    "Computer Graphics Designer", "Blockchain Developer", "IT Auditor",
  ],
  "health-sciences": [
    "Medical Doctor", "Registered Nurse", "Pharmacist", "Physiotherapist",
    "Occupational Therapist", "Clinical Psychologist", "Radiographer", "Dentist",
    "Social Worker", "Dietitian", "Speech Therapist", "Paramedic",
    "Medical Laboratory Scientist", "Optometrist", "Audiologist", "Midwife",
    "Mental Health Counsellor", "Veterinarian", "Public Health Officer",
    "Community Health Worker",
  ],
  "finance-economics": [
    "Chartered Accountant", "Financial Analyst", "Investment Banker", "Actuary",
    "Auditor", "Tax Consultant", "Financial Planner", "Stockbroker",
    "Risk Manager", "Management Accountant", "Credit Analyst", "Insurance Broker",
    "Economist", "Forensic Accountant", "Treasury Manager", "Compliance Officer",
    "Pension Fund Manager", "Mortgage Advisor", "Financial Controller",
  ],
  "engineering-manufacturing": [
    "Mechanical Engineer", "Civil Engineer", "Electrical Engineer", "Chemical Engineer",
    "Industrial Engineer", "Structural Engineer", "Aerospace Engineer",
    "Environmental Engineer", "Biomedical Engineer", "Manufacturing Engineer",
    "Process Engineer", "Quality Assurance Engineer", "Materials Engineer",
    "Petroleum Engineer", "Robotics Engineer", "Automotive Engineer",
    "Telecommunications Engineer", "Marine Engineer",
  ],
  "education-training": [
    "Foundation Phase Teacher", "Intermediate Phase Teacher", "High School Teacher",
    "University Lecturer", "Educational Psychologist", "Curriculum Developer",
    "Corporate Trainer", "E-Learning Designer", "School Counsellor",
    "Special Education Teacher", "Librarian", "Early Childhood Practitioner",
    "TVET College Lecturer", "Adult Education Facilitator", "Life Orientation Teacher",
  ],
  "business-management": [
    "Business Analyst", "Human Resources Manager", "Marketing Manager",
    "Operations Manager", "Entrepreneur", "Project Manager", "Supply Chain Manager",
    "Brand Manager", "Customer Service Manager", "Office Manager",
    "Procurement Officer", "Public Relations Manager", "Event Manager",
    "Sales Manager", "Retail Manager", "Business Development Manager",
    "Strategy Consultant", "Change Management Consultant",
  ],
  "arts-design": [
    "Graphic Designer", "Fashion Designer", "Interior Designer", "Architect",
    "Film Director", "Photographer", "Animator", "Illustrator", "Music Producer",
    "Actor/Performer", "Video Game Designer", "Jewellery Designer",
    "Industrial Designer", "Art Director", "Sound Engineer", "Copywriter",
    "Set Designer", "Exhibition Designer", "Textile Designer", "Tattoo Artist",
  ],
  "science-mathematics": [
    "Research Scientist", "Mathematician", "Chemist", "Physicist", "Biologist",
    "Geologist", "Marine Biologist", "Environmental Scientist", "Biotechnologist",
    "Forensic Scientist", "Statistician", "Astronomer", "Microbiologist",
    "Food Scientist", "Materials Scientist", "Oceanographer", "Epidemiologist",
    "Nanotechnologist",
  ],
  "agriculture-forestry": [
    "Agricultural Scientist", "Farm Manager", "Horticulturist", "Animal Scientist",
    "Forestry Officer", "Fisheries Scientist", "Agricultural Extension Officer",
    "Food Technologist", "Soil Scientist", "Conservation Ecologist",
    "Agribusiness Manager", "Irrigation Engineer", "Wildlife Manager",
    "Crop Scientist", "Aquaculture Specialist",
  ],
  "law-criminal-justice": [
    "Attorney", "Advocate", "Magistrate", "Legal Advisor", "Police Officer",
    "Forensic Investigator", "Criminologist", "Court Interpreter",
    "Correctional Services Officer", "Private Investigator", "Legal Aid Paralegal",
    "Security Manager", "Cybercrime Investigator", "Legal Secretary",
    "Court Clerk", "Human Rights Lawyer",
  ],
  "communication-media": [
    "Journalist", "News Anchor", "Public Relations Practitioner",
    "Advertising Copywriter", "Media Buyer", "Radio Presenter", "Podcaster",
    "Social Media Manager", "Content Creator", "Communications Officer",
    "Editor", "Publisher", "Translator/Interpreter", "Film Critic",
    "Broadcast Producer", "Digital Content Strategist",
  ],
  "construction-built-environment": [
    "Quantity Surveyor", "Urban Planner", "Construction Manager",
    "Civil Draughtsman", "Property Developer", "Building Inspector",
    "Land Surveyor", "Landscape Architect", "Electrician", "Plumber",
    "Property Valuer", "Real Estate Agent", "Facilities Manager",
    "Project Architect", "Building Information Modelling Specialist",
  ],
  "transport-logistics-tourism": [
    "Logistics Manager", "Supply Chain Analyst", "Commercial Pilot",
    "Air Traffic Controller", "Tour Operator", "Hotel Manager", "Travel Agent",
    "Events Manager", "Transport Planner", "Customs Officer",
    "Freight Forwarder", "Cruise Ship Officer", "Tourism Marketing Manager",
    "Chef", "Sommelier",
  ],
  "public-administration": [
    "Government Policy Analyst", "Diplomat", "Municipal Manager",
    "Public Health Inspector", "Development Worker", "Non-Profit Manager",
    "Environmental Regulator", "Parliament Researcher", "Home Affairs Officer",
    "Local Government Councillor", "Public Finance Manager",
    "Community Development Officer", "International Relations Officer",
  ],
  "mining-resources": [
    "Mining Engineer", "Geologist", "Metallurgist", "Mine Safety Officer",
    "Mineral Processing Engineer", "Mine Surveyor", "Environmental Manager",
    "Mine Planner", "Rock Mechanics Engineer", "Ventilation Engineer",
    "Drill and Blast Engineer", "Hydrogeologist", "Gemologist",
  ],
};

// ── Shared field helpers ───────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "6px" }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "8px 12px", fontSize: "13px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }}
    />
  );
}

const CONTENT_TYPES = [
  { label: "Career",                        value: "CAREER" },
  { label: "University — All Programmes",   value: "UNIVERSITY_PROGRAMMES_BULK" },
  { label: "University — Single Programme", value: "UNIVERSITY_PROGRAMME" },
  { label: "TVET — All Programmes",         value: "TVET_PROGRAMMES_BULK" },
  { label: "Career Pathway",                value: "PATHWAY" },
  { label: "Bursary",                       value: "BURSARY" },
  { label: "Assessment — Bulk Questions",   value: "ASSESSMENT_QUESTIONS_BULK" },
];

const PATHWAY_TYPES = [
  { label: "University degree",  value: "UNIVERSITY" },
  { label: "TVET college",       value: "TVET" },
  { label: "Learnership / SETA", value: "LEARNERSHIP" },
  { label: "Direct / RPL",       value: "DIRECT" },
];

const ASSESSMENT_TYPES = [
  { label: "Interest",    value: "INTEREST" },
  { label: "Aptitude",    value: "APTITUDE" },
  { label: "Personality", value: "PERSONALITY" },
  { label: "Values",      value: "VALUES" },
];

// ── Generate tab ──────────────────────────────────────────────────────────────

function GenerateTab({ clusters, templates, universities, tvetColleges, onQueued }: { clusters: any[]; templates: any[]; universities: any[]; tvetColleges: any[]; onQueued: () => void }) {
  const [contentType, setContentType] = useState("CAREER");
  const [templateId, setTemplateId]   = useState("");
  const [params, setParams]           = useState<any>({});
  const [submitting, setSubmitting]   = useState(false);
  const [success, setSuccess]         = useState("");
  const [error, setError]             = useState("");

  const handleTypeChange = (v: string) => { setContentType(v); setTemplateId(""); setParams({}); setError(""); };

  const filteredTemplates = templates.filter((t) => t.contentType === contentType && t.isActive);

  const validate = () => {
    if (contentType === "CAREER" && !params.clusterId) return "Please select a cluster";
    if (contentType === "CAREER" && !params.title) return "Please select or type a career title";
    if (contentType === "UNIVERSITY_PROGRAMMES_BULK" && !params.universityId) return "Please select a university";
    if (contentType === "UNIVERSITY_PROGRAMME" && !params.universityId) return "Please select a university";
    if (contentType === "UNIVERSITY_PROGRAMME" && !params.name) return "Programme name is required";
    if (contentType === "TVET_PROGRAMMES_BULK" && !params.collegeId) return "Please select a TVET college";
    if (contentType === "PATHWAY" && !params.careerId) return "Please select a career";
    if (contentType === "PATHWAY" && !params.pathwayType) return "Please select a pathway type";
    if (contentType === "BURSARY" && (!params.name || !params.provider)) return "Bursary name and provider are required";
    if (contentType === "ASSESSMENT_QUESTIONS_BULK" && !params.assessmentType) return "Please select an assessment type";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(""); setSuccess(""); setSubmitting(true);
    try {
      await apiClient.post("/content/jobs", {
        contentType,
        promptTemplateId: templateId || undefined,
        parameters: params,
      });
      setSuccess("Job queued! Check the Queue tab to track progress.");
      setParams(contentType === "ASSESSMENT_QUESTION" ? { type: "INTEREST" } : {});
      setTemplateId("");
      onQueued();
      setTimeout(() => setSuccess(""), 8000);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to queue job");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "20px" }}>
      <Card title="New generation job">
        {success && (
          <div style={{ padding: "10px 14px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#22c55e", marginBottom: "16px" }}>
            ✓ {success}
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

          {/* CAREER */}
          {contentType === "CAREER" && (
            <>
              <Field label="Career cluster *" hint="Pick a cluster — this scopes Claude to the right industry">
                <Select
                  value={params.clusterId ?? ""}
                  onChange={(v) => {
                    const cluster = clusters.find((c) => c.id === v);
                    setParams({ clusterId: v, clusterName: cluster?.name, clusterSlug: cluster?.slug, title: "" });
                  }}
                  options={[
                    { label: "Select a cluster…", value: "" },
                    ...clusters.map((c) => ({ label: `${c.name}  (${c._count?.careers ?? 0} careers)`, value: c.id })),
                  ]}
                />
              </Field>

              {params.clusterId && (
                <Field label="Career title *" hint="Choose from the list — or type your own below">
                  {/* Preset picker */}
                  {SA_CAREERS[params.clusterSlug ?? ""] && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                      {SA_CAREERS[params.clusterSlug ?? ""].map((title) => (
                        <button
                          key={title}
                          onClick={() => setParams({ ...params, title })}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "999px",
                            border: `1px solid ${params.title === title ? "var(--color-accent)" : "var(--color-border)"}`,
                            background: params.title === title ? "var(--color-accent)" : "var(--color-bg-secondary)",
                            color: params.title === title ? "#fff" : "var(--color-text-secondary)",
                            fontSize: "12px",
                            cursor: "pointer",
                            transition: "all 0.12s",
                          }}
                        >
                          {title}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Or type custom */}
                  <TextInput
                    value={params.title ?? ""}
                    onChange={(v) => setParams({ ...params, title: v })}
                    placeholder="Or type a custom career title…"
                  />
                </Field>
              )}
            </>
          )}

          {/* UNIVERSITY PROGRAMMES BULK */}
          {contentType === "UNIVERSITY_PROGRAMMES_BULK" && (
            <>
              <div style={{ padding: "12px 14px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                <strong style={{ color: "var(--color-accent)" }}>Bulk mode</strong> — Claude will generate the full programme list for the selected university in one job (25–50 programmes across all faculties). This saves hours of manual data entry.
              </div>
              <Field label="University *" hint="All undergraduate programmes for this university will be generated">
                <Select
                  value={params.universityId ?? ""}
                  onChange={(v) => {
                    const uni = universities.find((u) => u.id === v);
                    setParams({ universityId: v, university: uni?.name ?? "" });
                  }}
                  options={[
                    { label: "Select a university…", value: "" },
                    ...universities.map((u) => ({ label: `${u.name}${u.abbreviation ? ` (${u.abbreviation})` : ""}`, value: u.id })),
                  ]}
                />
              </Field>
              {params.universityId && (
                <div style={{ padding: "10px 12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", fontSize: "12px", color: "var(--color-text-muted)" }}>
                  Claude will generate programmes for <strong style={{ color: "var(--color-text-primary)" }}>{params.university}</strong> including BSc, BA, BEng, BEd, BNurs, BAdmin and all other undergraduate qualifications across every faculty.
                </div>
              )}
            </>
          )}

          {/* UNIVERSITY PROGRAMME (single) */}
          {contentType === "UNIVERSITY_PROGRAMME" && (
            <>
              <Field label="University *" hint="Select which university to generate a programme for">
                <Select
                  value={params.universityId ?? ""}
                  onChange={(v) => {
                    const uni = universities.find((u) => u.id === v);
                    setParams({ ...params, universityId: v, university: uni?.name ?? "" });
                  }}
                  options={[
                    { label: "Select a university…", value: "" },
                    ...universities.map((u) => ({ label: `${u.name}${u.abbreviation ? ` (${u.abbreviation})` : ""}`, value: u.id })),
                  ]}
                />
              </Field>
              <Field label="Programme name *" hint="e.g. BSc Computer Science, BEng Mechanical Engineering">
                <TextInput value={params.name ?? ""} onChange={(v) => setParams({ ...params, name: v })} placeholder="BSc Computer Science" />
              </Field>
              <Field label="Faculty" hint="Optional — e.g. Faculty of Engineering">
                <TextInput value={params.faculty ?? ""} onChange={(v) => setParams({ ...params, faculty: v })} placeholder="Faculty of Science" />
              </Field>
            </>
          )}

          {/* TVET PROGRAMMES BULK */}
          {contentType === "TVET_PROGRAMMES_BULK" && (
            <>
              <div style={{ padding: "12px 14px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                <strong style={{ color: "var(--color-accent)" }}>Bulk mode</strong> — Claude will generate all NCV (Levels 2–4) and NATED (N1–N6) programmes for the selected college in one job. Source: DHET national programme frameworks.
              </div>
              <Field label="TVET College *" hint="All NCV and NATED programmes for this college will be generated">
                <Select
                  value={params.collegeId ?? ""}
                  onChange={(v) => {
                    const col = tvetColleges.find((c: any) => c.id === v);
                    setParams({ collegeId: v, college: col?.name ?? "" });
                  }}
                  options={[
                    { label: "Select a TVET college…", value: "" },
                    ...tvetColleges.map((c: any) => ({ label: `${c.name} — ${c.province}`, value: c.id })),
                  ]}
                />
              </Field>
              {params.collegeId && (
                <div style={{ padding: "10px 12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", fontSize: "12px", color: "var(--color-text-muted)" }}>
                  Generating NCV + NATED programmes for <strong style={{ color: "var(--color-text-primary)" }}>{params.college}</strong>.
                  Includes Engineering, Business, IT, Hospitality and other nationalised fields.
                </div>
              )}
            </>
          )}

          {/* PATHWAY */}
          {contentType === "PATHWAY" && (
            <>
              {clusters.flatMap((c: any) => c.careers ?? []).length === 0 ? (
                <div style={{ padding: "12px 14px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#f59e0b" }}>
                  No careers found. Generate careers first in the Careers Library, then come back to create pathways.
                </div>
              ) : (
                <>
                  <Field label="Career *" hint="Pick the career this pathway leads to">
                    <Select
                      value={params.careerId ?? ""}
                      onChange={(v) => {
                        const allCareers = clusters.flatMap((c: any) => (c.careers ?? []).map((cr: any) => ({ ...cr, clusterName: c.name })));
                        const career = allCareers.find((cr: any) => cr.id === v);
                        setParams({ ...params, careerId: v, careerTitle: career?.title ?? "" });
                      }}
                      options={[
                        { label: "Select a career…", value: "" },
                        ...clusters
                          .filter((c: any) => (c.careers ?? []).length > 0)
                          .flatMap((c: any) =>
                            (c.careers ?? []).map((cr: any) => ({
                              label: `${cr.title}  —  ${c.name}`,
                              value: cr.id,
                            }))
                          ),
                      ]}
                    />
                  </Field>

                  {params.careerId && (
                    <div style={{ padding: "8px 12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", fontSize: "12px", color: "var(--color-text-muted)" }}>
                      Generating pathway for: <strong style={{ color: "var(--color-text-primary)" }}>{params.careerTitle}</strong>
                    </div>
                  )}

                  <Field label="Pathway type *" hint="Which route to generate for this career">
                    <Select
                      value={params.pathwayType ?? ""}
                      onChange={(v) => setParams({ ...params, pathwayType: v })}
                      options={[{ label: "Select a route…", value: "" }, ...PATHWAY_TYPES]}
                    />
                  </Field>

                  {params.pathwayType === "LEARNERSHIP" && (
                    <Field label="SETA name" hint="Optional — e.g. MERSETA, EWSETA, SASSETA">
                      <TextInput value={params.setaName ?? ""} onChange={(v) => setParams({ ...params, setaName: v })} placeholder="e.g. MERSETA" />
                    </Field>
                  )}
                </>
              )}
            </>
          )}

          {/* BURSARY */}
          {contentType === "BURSARY" && (
            <>
              <Field label="Bursary name *">
                <TextInput value={params.name ?? ""} onChange={(v) => setParams({ ...params, name: v })} placeholder="Sasol Bursary Programme" />
              </Field>
              <Field label="Provider / organisation *">
                <TextInput value={params.provider ?? ""} onChange={(v) => setParams({ ...params, provider: v })} placeholder="Sasol" />
              </Field>
              <Field label="Sector" hint="Optional — e.g. Engineering">
                <TextInput value={params.sector ?? ""} onChange={(v) => setParams({ ...params, sector: v })} placeholder="Engineering" />
              </Field>
            </>
          )}

          {/* ASSESSMENT QUESTIONS BULK */}
          {contentType === "ASSESSMENT_QUESTIONS_BULK" && (
            <>
              <div style={{ padding: "12px 14px", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "var(--radius-sm)", marginBottom: "4px" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "4px" }}>Professional assessment bank generation</p>
                <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                  Generates a full set of psychometrically designed questions in one job. Each learner is served a random selection of ~20 from the bank — so no two learners get identical tests. Run this for all 4 types to build a complete bank.
                </p>
              </div>
              <Field label="Assessment type *" hint="Run separately for each type to build the full bank">
                <Select
                  value={params.assessmentType ?? ""}
                  onChange={(v) => setParams({ ...params, assessmentType: v })}
                  options={[{ label: "Select type…", value: "" }, ...ASSESSMENT_TYPES]}
                />
              </Field>
              <Field label="Number of questions" hint="Recommended: 25 per type (100 total). Each learner will answer ~20 randomly selected.">
                <Select
                  value={String(params.count ?? "25")}
                  onChange={(v) => setParams({ ...params, count: Number(v) })}
                  options={[
                    { label: "20 questions",  value: "20" },
                    { label: "25 questions (recommended)", value: "25" },
                    { label: "30 questions",  value: "30" },
                  ]}
                />
              </Field>
              {params.assessmentType && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[
                    { type: "INTEREST",    note: "Maps to RIASEC — the core career matching engine" },
                    { type: "APTITUDE",    note: "Numerical, verbal, spatial reasoning" },
                    { type: "PERSONALITY", note: "Work-style: structured/creative, solo/team" },
                    { type: "VALUES",      note: "What matters: income, impact, security, freedom" },
                  ].map(({ type, note }) => (
                    <div key={type} onClick={() => setParams({ ...params, assessmentType: type })} style={{ padding: "10px 12px", borderRadius: "var(--radius-sm)", border: `2px solid ${params.assessmentType === type ? "var(--color-accent)" : "var(--color-border)"}`, background: params.assessmentType === type ? "rgba(99,102,241,0.05)" : "var(--color-card-bg)", cursor: "pointer" }}>
                      <p style={{ fontSize: "12px", fontWeight: 700, color: params.assessmentType === type ? "var(--color-accent)" : "var(--color-text-primary)" }}>{type}</p>
                      <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>{note}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <Field label="Prompt template">
            <Select
              value={templateId}
              onChange={setTemplateId}
              options={[
                { label: "Use default SA-optimised prompt", value: "" },
                ...filteredTemplates.map((t) => ({ label: `${t.name} (v${t.version})`, value: t.id })),
              ]}
            />
          </Field>

          <div style={{ paddingTop: "4px" }}>
            <Btn
              label={submitting ? "Queuing…"
                : contentType === "UNIVERSITY_PROGRAMMES_BULK" ? "Generate all programmes"
                : contentType === "ASSESSMENT_QUESTIONS_BULK" ? `Generate ${params.count ?? 25} questions`
                : "Queue generation job"}
              onClick={handleSubmit}
            />
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Card title="How it works">
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[
              { n: "1", color: "#6366f1", title: "Job queued",        desc: "Your request goes into the queue. The AI worker picks it up within seconds." },
              { n: "2", color: "#3b82f6", title: "Claude generates",  desc: "Uses an SA-optimised prompt to produce a structured career, programme or bursary entry." },
              { n: "3", color: "#8b5cf6", title: "Entry saved",       desc: "Saved to the database with status AI_GENERATED. Check the Queue tab." },
              { n: "4", color: "#f59e0b", title: "Assign for review", desc: "Head to Careers Library or Review Queue to assign it to a reviewer." },
              { n: "5", color: "#22c55e", title: "Goes live",         desc: "After review + data verification, status becomes VERIFIED and learners can see it." },
            ].map(({ n, color, title, desc }) => (
              <div key={n} style={{ display: "flex", gap: "12px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{n}</div>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{title}</p>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {contentType === "CAREER" && clusters.length > 0 && (
          <Card title="Clusters">
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {clusters.map((c) => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{c.name}</span>
                  <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{c._count?.careers ?? 0}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Queue tab ─────────────────────────────────────────────────────────────────

function QueueTab({ jobs, pagination, loading, status, setStatus, page, setPage, onRefresh, onRetry, retrying }: any) {
  const countByStatus = (s: string) => jobs.filter((j: any) => j.status === s).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px" }}>
        <StatCard label="Total jobs"  value={pagination.total} />
        <StatCard label="Queued"      value={countByStatus("QUEUED")}     accent="#94a3b8" />
        <StatCard label="Processing"  value={countByStatus("PROCESSING")} accent="#3b82f6" />
        <StatCard label="Completed"   value={countByStatus("COMPLETED")}  accent="#22c55e" />
        <StatCard label="Failed"      value={countByStatus("FAILED")}     accent="#ef4444" />
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[
          { label: "All statuses", value: "" },
          { label: "Queued",       value: "QUEUED" },
          { label: "Processing",   value: "PROCESSING" },
          { label: "Completed",    value: "COMPLETED" },
          { label: "Failed",       value: "FAILED" },
        ]} />
        <Btn label="Refresh" onClick={onRefresh} variant="ghost" small />
      </div>

      <Card noPad>
        {loading ? <Spinner /> : jobs.length === 0 ? <Empty message="No generation jobs yet" /> : (
          <Table headers={["Type", "Parameters", "Prompt", "Requested by", "Status", "Queued", "Completed", ""]}>
            {jobs.map((j: any) => (
              <TableRow
                key={j.id}
                cols={[
                  <span style={{ fontWeight: 500 }}>{j.contentType}</span>,
                  j.parameters
                    ? <span style={{ fontSize: "11px", color: "var(--color-text-muted)", maxWidth: "180px", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {(j.parameters as any).university
                          ? `${(j.parameters as any).university}${(j.parameters as any).name ? ` · ${(j.parameters as any).name}` : ""}`
                          : (j.parameters as any).title
                            ? `${(j.parameters as any).clusterName ?? ""} · ${(j.parameters as any).title}`
                            : JSON.stringify(j.parameters)}
                      </span>
                    : "—",
                  j.promptTemplate ? `${j.promptTemplate.name} v${j.promptTemplate.version}` : <span style={{ color: "var(--color-text-muted)" }}>default</span>,
                  displayName(j.requestedBy),
                  statusBadge(j.status),
                  timeAgo(j.createdAt),
                  j.completedAt ? timeAgo(j.completedAt) : "—",
                  j.status === "FAILED"
                    ? <Btn label={retrying === j.id ? "…" : "Retry"} onClick={() => onRetry(j.id)} variant="ghost" small />
                    : null,
                ]}
              />
            ))}
          </Table>
        )}
        <Pagination page={page} pages={pagination.pages} onPage={setPage} />
      </Card>

      {jobs.some((j: any) => j.status === "FAILED" && j.errorLog) && (
        <Card title="Error log">
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {jobs.filter((j: any) => j.status === "FAILED" && j.errorLog).map((j: any) => (
              <div key={j.id}>
                <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "4px" }}>{j.contentType} · {timeAgo(j.createdAt)}</p>
                <pre style={{ fontSize: "11px", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "var(--radius-sm)", padding: "8px 10px", color: "#ef4444", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0 }}>
                  {typeof j.errorLog === "string" ? j.errorLog : JSON.stringify(j.errorLog, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Bursary Scraper tab ───────────────────────────────────────────────────────

interface BursarySource {
  key: string; label: string; url: string; description: string;
}

function BursaryScraperTab({ onQueued }: { onQueued: () => void }) {
  const [sources, setSources]       = useState<BursarySource[]>([]);
  const [selected, setSelected]     = useState<string[]>([]);
  const [running, setRunning]       = useState<string[]>([]);
  const [results, setResults]       = useState<Record<string, { saved: number; skipped: number; errors: string[] }>>({});
  const [error, setError]           = useState("");

  useEffect(() => {
    apiClient.get("/bursaries/scrape/sources")
      .then((r) => setSources(r.data.data ?? []))
      .catch(() => {});
  }, []);

  const toggle = (key: string) =>
    setSelected((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

  const selectAll = () => setSelected(sources.map((s) => s.key));
  const clearAll  = () => setSelected([]);

  const scrapeSelected = async () => {
    if (selected.length === 0) { setError("Select at least one source"); return; }
    setError("");

    for (const key of selected) {
      setRunning((p) => [...p, key]);
      try {
        const res = await apiClient.post("/bursaries/scrape", { sourceKey: key });
        // Job queued — show optimistic count info
        setResults((prev) => ({ ...prev, [key]: { saved: 0, skipped: 0, errors: [], queued: true } as any }));
      } catch (e: any) {
        setResults((prev) => ({
          ...prev,
          [key]: { saved: 0, skipped: 0, errors: [e?.response?.data?.message ?? "Failed"] },
        }));
      } finally {
        setRunning((p) => p.filter((k) => k !== key));
      }
    }
    onQueued();
  };

  const fieldColors: Record<string, string> = {
    "Engineering":          "#6366f1",
    "Science":              "#3b82f6",
    "Commerce":             "#f59e0b",
    "Agriculture":          "#22c55e",
    "IT":                   "#0ea5e9",
    "Health Sciences":      "#ec4899",
    "Mining":               "#78716c",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Info banner */}
      <div style={{ padding: "16px 20px", background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: "var(--radius-sm)", display: "flex", gap: "14px", alignItems: "flex-start" }}>
        <span style={{ fontSize: "22px", flexShrink: 0 }}>🕷️</span>
        <div>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "4px" }}>Web Scraper Agent</p>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            Select one or more sources. The agent fetches each site, extracts every bursary it finds, and saves them as <strong>AI_GENERATED</strong> — ready to appear in the Review Queue for a reviewer to verify before learners see them.
          </p>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "6px" }}>
            Duplicate bursaries (same name + provider) are detected and skipped. Closing dates are updated if a newer date is found.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "#ef4444" }}>
          {error}
        </div>
      )}

      {/* Source grid */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
            {sources.length} sources available
          </p>
          <button onClick={selectAll} style={{ fontSize: "12px", color: "var(--color-accent)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Select all</button>
          <button onClick={clearAll}  style={{ fontSize: "12px", color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Clear</button>
          <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--color-text-muted)" }}>
            {selected.length} selected
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
          {sources.map((src) => {
            const isSelected = selected.includes(src.key);
            const isRunning  = running.includes(src.key);
            const result     = results[src.key];

            return (
              <div
                key={src.key}
                onClick={() => !isRunning && toggle(src.key)}
                style={{
                  padding: "14px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: `2px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                  background: isSelected ? "rgba(99,102,241,0.04)" : "var(--color-card-bg)",
                  cursor: isRunning ? "wait" : "pointer",
                  transition: "all 0.12s",
                  position: "relative",
                  opacity: isRunning ? 0.7 : 1,
                }}
              >
                {/* Selection indicator */}
                <div style={{
                  position: "absolute", top: "12px", right: "12px",
                  width: "18px", height: "18px", borderRadius: "50%",
                  border: `2px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                  background: isSelected ? "var(--color-accent)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "10px", color: "#fff", fontWeight: 700,
                }}>
                  {isSelected ? "✓" : ""}
                </div>

                <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "3px", paddingRight: "24px" }}>
                  {isRunning ? "⏳ " : ""}{src.label}
                </p>
                <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "8px", lineHeight: 1.5 }}>
                  {src.description}
                </p>
                <p style={{ fontSize: "10px", color: "var(--color-text-muted)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {src.url}
                </p>

                {/* Result badge */}
                {result && (
                  <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {(result as any).queued ? (
                      <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.25)", fontWeight: 600 }}>✓ Queued</span>
                    ) : (
                      <>
                        <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.25)", fontWeight: 600 }}>{result.saved} saved</span>
                        {result.skipped > 0 && <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", background: "rgba(148,163,184,0.1)", color: "#64748b", border: "1px solid rgba(148,163,184,0.25)" }}>{result.skipped} skipped</span>}
                        {result.errors.length > 0 && <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>⚠ {result.errors.length} error{result.errors.length > 1 ? "s" : ""}</span>}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
            {selected.length === 0 ? "No sources selected" : `${selected.length} source${selected.length > 1 ? "s" : ""} selected`}
          </p>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "1px" }}>
            Each source is scraped independently. Jobs appear in the Queue tab.
          </p>
        </div>
        <Btn
          label={running.length > 0 ? `Scraping ${running.length}…` : "🕷️ Start scraping"}
          onClick={scrapeSelected}
        />
      </div>

      {/* What happens next */}
      <Card title="What happens after scraping">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            { n: "1", color: "#0ea5e9", title: "Agent fetches the page",      desc: "Axios requests the HTML from the source URL, strips navigation/ads, extracts readable text." },
            { n: "2", color: "#6366f1", title: "Claude extracts bursaries",   desc: "Claude reads the page text and returns structured JSON: name, provider, amount, closing date, fields of study, eligibility." },
            { n: "3", color: "#f59e0b", title: "Deduplication check",         desc: "Each bursary is matched against the database. Duplicates are skipped; closing dates are updated if newer info is found." },
            { n: "4", color: "#8b5cf6", title: "Saved as AI_GENERATED",       desc: "New bursaries go to the database with status AI_GENERATED — they are NOT visible to learners yet." },
            { n: "5", color: "#22c55e", title: "Assign to a reviewer",        desc: "Go to Review Queue → Bursaries filter → assign a reviewer to each. They verify accuracy and approve." },
          ].map(({ n, color, title, desc }) => (
            <div key={n} style={{ display: "flex", gap: "12px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>{n}</div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{title}</p>
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px", lineHeight: 1.5 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AdminAIPipelinePage() {
  const [tab, setTab]               = useState<"generate" | "scrape" | "queue">("generate");
  const [clusters, setClusters]     = useState<any[]>([]);
  const [templates, setTemplates]   = useState<any[]>([]);
  const [universities, setUniversities]   = useState<any[]>([]);
  const [tvetColleges, setTvetColleges]   = useState<any[]>([]);
  const [jobs, setJobs]             = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]       = useState(true);
  const [status, setStatus]         = useState("");
  const [page, setPage]             = useState(1);
  const [retrying, setRetrying]     = useState<string | null>(null);

  const loadQueue = useCallback(() => {
    setLoading(true);
    const params: any = { page };
    if (status) params.status = status;
    apiClient.get("/content/jobs", { params })
      .then((r) => { setJobs(r.data.data.jobs ?? []); setPagination(r.data.data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => {
    apiClient.get("/careers/clusters").then((r) => setClusters(r.data.data ?? [])).catch(() => {});
    apiClient.get("/content/prompts").then((r) => setTemplates(r.data.data ?? [])).catch(() => {});
    apiClient.get("/universities", { params: { page: 1, limit: 100 } }).then((r) => setUniversities(r.data.data?.universities ?? [])).catch(() => {});
    apiClient.get("/tvet", { params: { page: 1, limit: 100, collegeType: "PUBLIC" } }).then((r) => setTvetColleges(r.data.data?.colleges ?? [])).catch(() => {});
    // Load ALL careers (any status) for the pathway selector — admins need to generate pathways for careers still in review
    apiClient.get("/careers", { params: { page: 1, limit: 500 } }).then((r) => {
      const allCareers = r.data.data?.careers ?? [];
      setClusters((prev) => prev.map((c) => ({ ...c, careers: allCareers.filter((cr: any) => cr.clusterId === c.id) })));
    }).catch(() => {});
  }, []);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  const handleQueued = () => { loadQueue(); setTimeout(() => setTab("queue"), 1500); };

  const retry = async (id: string) => {
    setRetrying(id);
    try { await apiClient.post(`/content/jobs/${id}/retry`); loadQueue(); }
    catch {}
    finally { setRetrying(null); }
  };

  const tabs: { key: "generate" | "scrape" | "queue"; label: string }[] = [
    { key: "generate", label: "Generate" },
    { key: "scrape",   label: "🕷️ Bursary Scraper" },
    { key: "queue",    label: `Queue${pagination.total > 0 ? ` (${pagination.total})` : ""}` },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader title="AI Pipeline" subtitle="Generate content with Claude and track your generation jobs" />

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", background: "var(--color-bg-secondary)", padding: "4px", borderRadius: "var(--radius-sm)", width: "fit-content", border: "1px solid var(--color-border)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "7px 20px",
              borderRadius: "calc(var(--radius-sm) - 2px)",
              border: "none",
              background: tab === t.key ? "var(--color-card-bg)" : "transparent",
              color: tab === t.key ? "var(--color-text-primary)" : "var(--color-text-muted)",
              fontSize: "13px",
              fontWeight: tab === t.key ? 600 : 400,
              cursor: "pointer",
              boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "generate" && (
        <GenerateTab clusters={clusters} templates={templates} universities={universities} tvetColleges={tvetColleges} onQueued={handleQueued} />
      )}

      {tab === "scrape" && (
        <BursaryScraperTab onQueued={handleQueued} />
      )}

      {tab === "queue" && (
        <QueueTab
          jobs={jobs} pagination={pagination} loading={loading}
          status={status} setStatus={setStatus}
          page={page} setPage={setPage}
          onRefresh={loadQueue} onRetry={retry} retrying={retrying}
        />
      )}
    </div>
  );
}
