"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import apiClient from "@/api/client";
import {
  PageHeader, Card, Btn, statusBadge, Spinner,
} from "@/features/admin/components/AdminShell";

const CONFIDENCE_LEVELS = [
  { label: "1 — Very uncertain",    value: 1 },
  { label: "2 — Somewhat uncertain", value: 2 },
  { label: "3 — Neutral",           value: 3 },
  { label: "4 — Fairly confident",  value: 4 },
  { label: "5 — Very confident",    value: 5 },
];

export function ReviewScreenPage() {
  const router       = useRouter();
  const params       = useParams();
  const searchParams = useSearchParams();
  const reviewId     = params?.reviewId as string;

  // ── Queue / playlist state ────────────────────────────────────────────────────
  const [siblingIds,  setSiblingIds]  = useState<string[]>([]);
  const [queueLabel,  setQueueLabel]  = useState("");

  const [review,     setReview]     = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [loadError,  setLoadError]  = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [submitDone,  setSubmitDone]  = useState(false);
  const [drafting,    setDrafting]    = useState(false);
  const [decision,   setDecision]   = useState<"VERIFIED" | "DISCARDED" | "">("");
  const [confidence, setConfidence] = useState(4);
  const [notes,      setNotes]      = useState("");
  const [error,      setError]      = useState("");
  const [draftMsg,   setDraftMsg]   = useState("");

  // Edit mode (career content editing)
  const [editing,  setEditing]  = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState("");

  // Question edit state
  const [qEditing, setQEditing] = useState(false);
  const [qData,    setQData]    = useState<{ questionText: string; options: Array<{ text: string; value: string; score: number }> }>({ questionText: "", options: [] });
  const [qSaving,  setQSaving]  = useState(false);
  const [qSaveMsg, setQSaveMsg] = useState("");

  // Bursary edit state
  const [bEditing, setBEditing] = useState(false);
  const [bData,    setBData]    = useState<Record<string, any>>({});
  const [bSaving,  setBSaving]  = useState(false);
  const [bSaveMsg, setBSaveMsg] = useState("");

  // Pathway edit state
  const [pEditing, setPEditing] = useState(false);
  const [pData,    setPData]    = useState<Record<string, any>>({});
  const [pSaving,  setPSaving]  = useState(false);
  const [pSaveMsg, setPSaveMsg] = useState("");

  const loadReview = () => {
    if (!reviewId) return;
    setLoading(true);
    setLoadError("");
    setSubmitDone(false);
    apiClient.get(`/content/reviews/${reviewId}`)
      .then((r) => {
        const rev = r.data.data;
        setReview(rev);
        // Pre-populate decision panel from existing data so re-edits are seamless
        if (rev.status === "APPROVED")  setDecision("VERIFIED");
        if (rev.status === "REJECTED")  setDecision("DISCARDED");
        if (rev.confidenceRating)       setConfidence(rev.confidenceRating);
        if (rev.notes)                  setNotes(rev.notes);
        if (rev.career) {
          setEditData({
            title:        rev.career.title        ?? "",
            overview:     rev.career.overview     ?? "",
            dayInTheLife: rev.career.dayInTheLife ?? "",
            howToGetThere:rev.career.howToGetThere?? "",
            saContext:    rev.career.saContext    ?? "",
            earningsMin:  rev.career.earningsMin  ?? "",
            earningsMax:  rev.career.earningsMax  ?? "",
          });
        }
        if (rev.bursary) {
          setBData({
            name:           rev.bursary.name           ?? "",
            provider:       rev.bursary.provider       ?? "",
            description:    rev.bursary.description    ?? "",
            amount:         rev.bursary.amount         ?? "",
            applicationUrl: rev.bursary.applicationUrl ?? "",
            sourceUrl:      rev.bursary.sourceUrl      ?? "",
            fieldsOfStudy:  Array.isArray(rev.bursary.fieldsOfStudy) ? [...rev.bursary.fieldsOfStudy] : [],
            openDate:       rev.bursary.openDate  ? rev.bursary.openDate.slice(0, 10)  : "",
            closeDate:      rev.bursary.closeDate ? rev.bursary.closeDate.slice(0, 10) : "",
          });
        }
        if (rev.question) {
          setQData({
            questionText: rev.question.questionText ?? "",
            options: Array.isArray(rev.question.options)
              ? rev.question.options.map((o: any) => ({ text: o.label ?? o.text ?? "", value: o.value ?? "", score: o.score ?? 0 }))
              : [],
          });
        }
        if (rev.pathway) {
          setPData({
            title:               rev.pathway.title               ?? "",
            entryRequirements:   rev.pathway.entryRequirements   ?? "",
            qualificationEarned: rev.pathway.qualificationEarned ?? "",
            employmentNote:      rev.pathway.employmentNote      ?? "",
            costNote:            rev.pathway.costNote            ?? "",
            estimatedCostMin:    rev.pathway.estimatedCostMin    ?? "",
            estimatedCostMax:    rev.pathway.estimatedCostMax    ?? "",
            steps:         Array.isArray(rev.pathway.steps)         ? rev.pathway.steps.map((s: any) => ({ ...s })) : [],
            pros:          Array.isArray(rev.pathway.pros)          ? [...rev.pathway.pros]          : [],
            cons:          Array.isArray(rev.pathway.cons)          ? [...rev.pathway.cons]          : [],
            fundingOptions:Array.isArray(rev.pathway.fundingOptions)? [...rev.pathway.fundingOptions]: [],
            setaName:            rev.pathway.setaName            ?? "",
          });
        }
      })
      .catch((e: any) => {
        const status  = e?.response?.status;
        const message = e?.response?.data?.message ?? e?.message ?? "Unknown error";
        setLoadError(`${status ? `${status} — ` : ""}${message}`);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReview(); }, [reviewId]);

  // Read the stable ordered ID list that was stored in sessionStorage when the
  // user clicked Review → in the queue. We never re-fetch it — it stays fixed for
  // the whole session so indices don't shift as items get approved/rejected.
  useEffect(() => {
    if (searchParams.get("fromQueue") !== "1") return;
    try {
      const stored = sessionStorage.getItem("reviewQueue");
      if (!stored) return;
      const { ids, label } = JSON.parse(stored) as { ids: string[]; label: string };
      setSiblingIds(ids);
      setQueueLabel(label);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once on mount

  const currentIdx = siblingIds.length > 0 ? siblingIds.indexOf(reviewId) : -1;

  const navigateTo = (id: string) => {
    router.push(`/reviewer/review/${id}?fromQueue=1`);
  };

  const goNext = () => { if (currentIdx >= 0 && currentIdx < siblingIds.length - 1) navigateTo(siblingIds[currentIdx + 1]); };
  const goPrev = () => { if (currentIdx > 0) navigateTo(siblingIds[currentIdx - 1]); };

  const saveEdits = async () => {
    if (!review?.career) return;
    setSaving(true); setSaveMsg("");
    try {
      // Only send fields that actually exist on the Career model
      const { title, overview, dayInTheLife, howToGetThere, saContext, earningsMin, earningsMax } = editData;
      await apiClient.patch(`/careers/${review.career.id}`, { title, overview, dayInTheLife, howToGetThere, saContext, earningsMin: earningsMin || null, earningsMax: earningsMax || null });
      await loadReview();
      setEditing(false);
      setSaveMsg("Changes saved ✓");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (e: any) {
      setSaveMsg(e?.response?.data?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const saveBursary = async () => {
    if (!review?.bursary) return;
    setBSaving(true); setBSaveMsg("");
    try {
      const payload = {
        ...bData,
        openDate:  bData.openDate  || null,
        closeDate: bData.closeDate || null,
        amount:    bData.amount    || null,
      };
      await apiClient.patch(`/bursaries/${review.bursary.id}`, payload);
      await loadReview();
      setBEditing(false);
      setBSaveMsg("Changes saved ✓");
      setTimeout(() => setBSaveMsg(""), 3000);
    } catch (e: any) {
      setBSaveMsg(e?.response?.data?.message ?? "Failed to save");
    } finally {
      setBSaving(false);
    }
  };

  const saveQuestion = async () => {
    if (!review?.question) return;
    setQSaving(true); setQSaveMsg("");
    try {
      await apiClient.patch(`/assessments/questions/${review.question.id}`, {
        questionText: qData.questionText,
        options:      qData.options.map((o) => ({ label: o.text, value: o.value, score: o.score })),
      });
      await loadReview();
      setQEditing(false);
      setQSaveMsg("Changes saved ✓");
      setTimeout(() => setQSaveMsg(""), 3000);
    } catch (e: any) {
      setQSaveMsg(e?.response?.data?.message ?? "Failed to save");
    } finally {
      setQSaving(false);
    }
  };

  const savePathway = async () => {
    if (!review?.pathway) return;
    setPSaving(true); setPSaveMsg("");
    try {
      await apiClient.patch(`/pathways/${review.pathway.id}`, pData);
      await loadReview();
      setPEditing(false);
      setPSaveMsg("Changes saved ✓");
      setTimeout(() => setPSaveMsg(""), 3000);
    } catch (e: any) {
      setPSaveMsg(e?.response?.data?.message ?? "Failed to save");
    } finally {
      setPSaving(false);
    }
  };

  const saveDraft = async () => {
    setDrafting(true); setDraftMsg(""); setError("");
    try {
      const res = await apiClient.patch(`/content/reviews/${reviewId}`, { draft: true, confidenceRating: confidence, notes });
      // Update local review so the pill and card title reflect DRAFT immediately
      setReview((prev: any) => ({ ...prev, status: "DRAFT" }));
      setDraftMsg("Draft saved ✓");
      setTimeout(() => setDraftMsg(""), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to save draft");
    } finally {
      setDrafting(false);
    }
  };

  const submit = async () => {
    if (!decision) { setError("Please select Verify or Discard"); return; }
    setSubmitting(true); setError("");
    try {
      await apiClient.patch(`/content/reviews/${reviewId}`, { decision, confidenceRating: confidence, notes });
      setSubmitDone(true);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const isCompleted = review?.status === "APPROVED" || review?.status === "REJECTED";

  const takeOffline = async () => {
    setSubmitting(true); setError("");
    try {
      await apiClient.patch(`/content/reviews/${reviewId}`, { decision: "TAKE_OFFLINE" });
      router.push("/reviewer");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to take offline");
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (loadError || !review) return (
    <div style={{ padding: "60px 40px", textAlign: "center" }}>
      <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "8px" }}>
        Could not load review
      </p>
      {loadError && (
        <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "20px", fontFamily: "monospace" }}>
          {loadError}
        </p>
      )}
      <button
        onClick={loadReview}
        style={{ padding: "8px 18px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-sm)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", marginRight: "10px" }}
      >
        Retry
      </button>
      <button
        onClick={() => router.push("/reviewer")}
        style={{ padding: "8px 18px", background: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}
      >
        ← Back to queue
      </button>
    </div>
  );

  const career      = review.career;
  const tvetCollege = review.tvetCollege;
  const bursary     = review.bursary;
  const pathway     = review.pathway;
  const question    = review.question;

  // ── helpers ──────────────────────────────────────────────────────────────────
  const openUrl = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const googleSearch = (q: string) => openUrl(`https://www.google.com/search?q=${encodeURIComponent(q)}`);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* ── Queue progress bar (only visible when launched from a filtered queue) ── */}
      {siblingIds.length > 0 && currentIdx >= 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 16px",
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
        }}>
          {/* Prev */}
          <button
            onClick={goPrev}
            disabled={currentIdx === 0}
            title="Previous item"
            style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              border: "1.5px solid var(--color-border)",
              background: currentIdx === 0 ? "transparent" : "var(--color-bg-subtle)",
              color: currentIdx === 0 ? "var(--color-border)" : "var(--color-text-muted)",
              cursor: currentIdx === 0 ? "default" : "pointer",
              fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ‹
          </button>

          {/* Progress track */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)" }}>
                {queueLabel}
              </span>
              <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                {currentIdx + 1} of {siblingIds.length}
              </span>
            </div>
            <div style={{ height: 4, background: "var(--color-border)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${((currentIdx + 1) / siblingIds.length) * 100}%`,
                background: "var(--color-accent)",
                borderRadius: 99,
                transition: "width 0.3s ease",
              }} />
            </div>
          </div>

          {/* Next */}
          <button
            onClick={goNext}
            disabled={currentIdx === siblingIds.length - 1}
            title="Next item"
            style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              border: "1.5px solid var(--color-border)",
              background: currentIdx === siblingIds.length - 1 ? "transparent" : "var(--color-bg-subtle)",
              color: currentIdx === siblingIds.length - 1 ? "var(--color-border)" : "var(--color-text-muted)",
              cursor: currentIdx === siblingIds.length - 1 ? "default" : "pointer",
              fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ›
          </button>
        </div>
      )}

      <PageHeader
        title="Review Content"
        subtitle={`${review.contentType?.replace(/_/g, " ")} · Assigned to you for verification`}
        action={<Btn label="← Back to queue" onClick={() => router.push("/reviewer")} variant="ghost" />}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr", gap: "20px", alignItems: "start" }}>

        {/* ── Left: content ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* ── TVET / Private college panel ── */}
          {tvetCollege && (
            <>
              <Card title="Institution profile">
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                    {tvetCollege.logoUrl ? (
                      <img src={tvetCollege.logoUrl} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "contain", border: "1px solid var(--color-border)", background: "#fff", padding: 4 }} />
                    ) : (
                      <div style={{ width: 56, height: 56, borderRadius: 8, background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🏫</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 4px" }}>
                        {tvetCollege.name}
                        {tvetCollege.abbreviation && <span style={{ fontSize: 13, fontWeight: 400, color: "var(--color-text-muted)", marginLeft: 8 }}>({tvetCollege.abbreviation})</span>}
                      </p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "var(--color-text-muted)", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: 4, padding: "2px 8px" }}>
                          📍 {tvetCollege.province}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: tvetCollege.collegeType === "PUBLIC" ? "rgba(34,197,94,0.1)" : "rgba(168,85,247,0.1)", color: tvetCollege.collegeType === "PUBLIC" ? "#16a34a" : "#9333ea", border: `1px solid ${tvetCollege.collegeType === "PUBLIC" ? "rgba(34,197,94,0.3)" : "rgba(168,85,247,0.3)"}` }}>
                          {tvetCollege.collegeType === "PUBLIC" ? "Public (DHET-funded)" : "Private college"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Verify online buttons — core of institution review */}
                  <div>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
                      Verify this institution online
                    </p>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {tvetCollege.website && (
                        <button
                          onClick={() => openUrl(tvetCollege.website!)}
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-sm)", color: "var(--color-accent-text)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                        >
                          🌐 Visit website
                        </button>
                      )}
                      {tvetCollege.sourceUrl && (
                        <button
                          onClick={() => openUrl(tvetCollege.sourceUrl!)}
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                        >
                          📄 Source listing
                        </button>
                      )}
                      <button
                        onClick={() => googleSearch(`${tvetCollege.name} TVET college South Africa`)}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                      >
                        🔍 Google search
                      </button>
                      <button
                        onClick={() => googleSearch(`site:tvetcolleges.co.za OR site:dhet.gov.za "${tvetCollege.name}"`)}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                      >
                        📋 DHET / tvetcolleges.co.za
                      </button>
                    </div>
                  </div>

                  {tvetCollege.verifiedNote && (
                    <div style={{ padding: "10px 12px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "#16a34a" }}>
                      ℹ️ {tvetCollege.verifiedNote}
                    </div>
                  )}
                </div>
              </Card>

              <Card title="What to check">
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    "The institution name matches a real South African TVET / private college",
                    "You can find it on tvetcolleges.co.za, DHET.gov.za, or its own website",
                    "Province listed is correct",
                    "College type (Public / Private) is accurate",
                    "Website URL is reachable and belongs to this institution",
                    "No duplicate entry already exists for this college",
                  ].map((check, i) => (
                    <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <span style={{ color: "#22c55e", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{check}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* ── Bursary panel ── */}
          {bursary && (
            <>
              <Card
                title="Bursary profile"
                action={
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {bSaveMsg && <span style={{ fontSize: 12, color: bSaveMsg.includes("✓") ? "#22c55e" : "#ef4444", fontWeight: 500 }}>{bSaveMsg}</span>}
                    {bEditing ? (
                      <>
                        <Btn label={bSaving ? "Saving…" : "Save changes"} onClick={saveBursary} small />
                        <Btn label="Cancel" onClick={() => setBEditing(false)} variant="ghost" small />
                      </>
                    ) : (
                      <Btn label="✏ Edit" onClick={() => setBEditing(true)} variant="ghost" small />
                    )}
                  </div>
                }
              >
                {bEditing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Core identity */}
                    {[
                      { key: "name",        label: "Bursary name",  rows: 1 },
                      { key: "provider",    label: "Provider",      rows: 1 },
                      { key: "description", label: "Description",   rows: 4 },
                      { key: "amount",      label: "Amount (e.g. R80 000/yr or Full cost)", rows: 1 },
                    ].map(({ key, label, rows }) => (
                      <div key={key}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</label>
                        {rows === 1
                          ? <input type="text" value={bData[key] ?? ""} onChange={(e) => setBData({ ...bData, [key]: e.target.value })} style={{ width: "100%", padding: "8px 10px", fontSize: 13, background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }} />
                          : <textarea value={bData[key] ?? ""} onChange={(e) => setBData({ ...bData, [key]: e.target.value })} rows={rows} style={{ width: "100%", padding: "8px 10px", fontSize: 13, background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
                        }
                      </div>
                    ))}

                    {/* URLs — most important for the reviewer */}
                    <div style={{ padding: "12px", background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "var(--radius-sm)", display: "flex", flexDirection: "column", gap: 10 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>🔗 Links — verify and correct these</p>
                      {[
                        { key: "applicationUrl", label: "Direct application URL", placeholder: "https://www.provider.co.za/bursary/apply" },
                        { key: "sourceUrl",      label: "Source / reference URL", placeholder: "https://…" },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</label>
                          <div style={{ display: "flex", gap: 6 }}>
                            <input
                              type="url"
                              value={bData[key] ?? ""}
                              onChange={(e) => setBData({ ...bData, [key]: e.target.value })}
                              placeholder={placeholder}
                              style={{ flex: 1, padding: "8px 10px", fontSize: 13, background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none" }}
                            />
                            {bData[key] && (
                              <button
                                onClick={() => window.open(bData[key], "_blank", "noopener,noreferrer")}
                                title="Test this URL"
                                style={{ padding: "0 12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-muted)", cursor: "pointer", fontSize: 14 }}
                              >
                                ↗
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Fields of study */}
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Fields of study</p>
                      {(bData.fieldsOfStudy as string[]).map((f, i) => (
                        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                          <input type="text" value={f} onChange={(e) => { const a = [...bData.fieldsOfStudy]; a[i] = e.target.value; setBData({ ...bData, fieldsOfStudy: a }); }} placeholder="e.g. Engineering" style={{ flex: 1, padding: "6px 10px", fontSize: 13, background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none" }} />
                          <button onClick={() => setBData({ ...bData, fieldsOfStudy: (bData.fieldsOfStudy as string[]).filter((_, j) => j !== i) })} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: "#dc2626", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                        </div>
                      ))}
                      <button onClick={() => setBData({ ...bData, fieldsOfStudy: [...bData.fieldsOfStudy, ""] })} style={{ width: "100%", padding: "7px", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-sm)", background: "transparent", color: "var(--color-text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add field</button>
                    </div>

                    {/* Dates */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[{ key: "openDate", label: "Open date" }, { key: "closeDate", label: "Closing date" }].map(({ key, label }) => (
                        <div key={key}>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</label>
                          <input type="date" value={bData[key] ?? ""} onChange={(e) => setBData({ ...bData, [key]: e.target.value })} style={{ width: "100%", padding: "8px 10px", fontSize: 13, background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div>
                      <p style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 4px" }}>{bursary.name}</p>
                      <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>Provided by <strong>{bursary.provider}</strong></p>
                    </div>

                    {/* Verify online */}
                    <div>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Verify this bursary online</p>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {bursary.applicationUrl && (
                          <button onClick={() => openUrl(bursary.applicationUrl!)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-sm)", color: "var(--color-accent-text)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                            🌐 Application page
                          </button>
                        )}
                        {bursary.sourceUrl && (
                          <button onClick={() => openUrl(bursary.sourceUrl!)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                            📄 Source
                          </button>
                        )}
                        <button onClick={() => googleSearch(`${bursary.name} bursary South Africa ${bursary.provider}`)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          🔍 Google search
                        </button>
                      </div>
                    </div>

                    {[
                      { label: "Amount",         value: bursary.amount },
                      { label: "Description",    value: bursary.description },
                      { label: "Fields of study",value: Array.isArray(bursary.fieldsOfStudy) ? bursary.fieldsOfStudy.join(", ") : null },
                      { label: "Open date",      value: bursary.openDate  ? new Date(bursary.openDate).toLocaleDateString("en-ZA")  : null },
                      { label: "Closing date",   value: bursary.closeDate ? new Date(bursary.closeDate).toLocaleDateString("en-ZA") : null },
                    ].filter(f => f.value).map(({ label, value }) => (
                      <div key={label}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</p>
                        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.7, margin: 0 }}>{value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
              <Card title="What to check">
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {["Bursary exists and is currently offered by this provider", "Application URL lands directly on the bursary page — not just the provider's homepage", "Test the URL using the ↗ button in Edit mode to confirm it works", "Fields of study match what the provider actually funds", "Closing date is correct for the current cycle", "No duplicate entry for this bursary already exists"].map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: 10 }}><span style={{ color: "#22c55e", fontWeight: 700 }}>✓</span><span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{c}</span></div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* ── Pathway panel ── */}
          {pathway && (
            <>
              <Card
                title="Pathway profile"
                action={
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {pSaveMsg && <span style={{ fontSize: 12, color: pSaveMsg.includes("✓") ? "#22c55e" : "#ef4444", fontWeight: 500 }}>{pSaveMsg}</span>}
                    {pEditing ? (
                      <>
                        <Btn label={pSaving ? "Saving…" : "Save changes"} onClick={savePathway} small />
                        <Btn label="Cancel" onClick={() => setPEditing(false)} variant="ghost" small />
                      </>
                    ) : (
                      <Btn label="✏ Edit" onClick={() => setPEditing(true)} variant="ghost" small />
                    )}
                  </div>
                }
              >
                {pEditing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Text fields */}
                    {[
                      { key: "title",               label: "Title",                rows: 1 },
                      { key: "entryRequirements",   label: "Entry requirements",   rows: 3 },
                      { key: "qualificationEarned", label: "Qualification earned", rows: 2 },
                      { key: "employmentNote",      label: "Employment note",      rows: 3 },
                      { key: "costNote",            label: "Cost note",            rows: 2 },
                      { key: "setaName",            label: "SETA",                 rows: 1 },
                    ].map(({ key, label, rows }) => (
                      <div key={key}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</label>
                        {rows === 1
                          ? <input type="text" value={pData[key] ?? ""} onChange={(e) => setPData({ ...pData, [key]: e.target.value })} style={{ width: "100%", padding: "8px 10px", fontSize: 13, background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }} />
                          : <textarea value={pData[key] ?? ""} onChange={(e) => setPData({ ...pData, [key]: e.target.value })} rows={rows} style={{ width: "100%", padding: "8px 10px", fontSize: 13, background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
                        }
                      </div>
                    ))}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[{ key: "estimatedCostMin", label: "Cost min (ZAR/yr)" }, { key: "estimatedCostMax", label: "Cost max (ZAR/yr)" }].map(({ key, label }) => (
                        <div key={key}>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</label>
                          <input type="number" value={pData[key] ?? ""} onChange={(e) => setPData({ ...pData, [key]: e.target.value })} style={{ width: "100%", padding: "8px 10px", fontSize: 13, background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }} />
                        </div>
                      ))}
                    </div>

                    {/* Funding options */}
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Funding options</p>
                      {(pData.fundingOptions as string[]).map((f, i) => (
                        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                          <input type="text" value={f} onChange={(e) => { const a = [...pData.fundingOptions]; a[i] = e.target.value; setPData({ ...pData, fundingOptions: a }); }} style={{ flex: 1, padding: "6px 10px", fontSize: 13, background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none" }} />
                          <button onClick={() => setPData({ ...pData, fundingOptions: pData.fundingOptions.filter((_: any, j: number) => j !== i) })} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: "#dc2626", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                        </div>
                      ))}
                      <button onClick={() => setPData({ ...pData, fundingOptions: [...pData.fundingOptions, ""] })} style={{ width: "100%", padding: "7px", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-sm)", background: "transparent", color: "var(--color-text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add funding option</button>
                    </div>

                    {/* Journey steps */}
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Journey steps</p>
                      {(pData.steps as any[]).map((s, i) => (
                        <div key={i} style={{ padding: "10px 12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", marginBottom: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", minWidth: 20 }}>#{i + 1}</span>
                            <input type="text" value={s.title ?? s.step ?? ""} placeholder="Step title" onChange={(e) => { const a = [...pData.steps]; a[i] = { ...a[i], title: e.target.value }; setPData({ ...pData, steps: a }); }} style={{ flex: 1, padding: "6px 10px", fontSize: 13, background: "var(--color-bg-primary, var(--color-bg))", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none" }} />
                            <button onClick={() => setPData({ ...pData, steps: pData.steps.filter((_: any, j: number) => j !== i) })} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: "#dc2626", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
                          </div>
                          <textarea value={s.description ?? ""} placeholder="Description…" rows={2} onChange={(e) => { const a = [...pData.steps]; a[i] = { ...a[i], description: e.target.value }; setPData({ ...pData, steps: a }); }} style={{ width: "100%", padding: "6px 10px", fontSize: 12, background: "var(--color-bg-primary, var(--color-bg))", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-secondary)", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
                          <input type="text" value={s.duration ?? ""} placeholder="Duration (e.g. Grade 10–12)" onChange={(e) => { const a = [...pData.steps]; a[i] = { ...a[i], duration: e.target.value }; setPData({ ...pData, steps: a }); }} style={{ padding: "5px 10px", fontSize: 12, background: "var(--color-bg-primary, var(--color-bg))", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-muted)", outline: "none" }} />
                        </div>
                      ))}
                      <button onClick={() => setPData({ ...pData, steps: [...pData.steps, { title: "", description: "", duration: "" }] })} style={{ width: "100%", padding: "7px", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-sm)", background: "transparent", color: "var(--color-text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add step</button>
                    </div>

                    {/* Pros / Cons */}
                    {(["pros", "cons"] as const).map((key) => {
                      const isPros = key === "pros";
                      const col = isPros ? "#16a34a" : "#dc2626";
                      return (
                        <div key={key}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: col, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{isPros ? "✓ Advantages" : "✗ Trade-offs"}</p>
                          {(pData[key] as string[]).map((item, i) => (
                            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                              <input type="text" value={item} onChange={(e) => { const a = [...pData[key]]; a[i] = e.target.value; setPData({ ...pData, [key]: a }); }} style={{ flex: 1, padding: "6px 10px", fontSize: 13, background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none" }} />
                              <button onClick={() => setPData({ ...pData, [key]: (pData[key] as string[]).filter((_, j) => j !== i) })} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: "#dc2626", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                            </div>
                          ))}
                          <button onClick={() => setPData({ ...pData, [key]: [...pData[key], ""] })} style={{ width: "100%", padding: "7px", border: `1.5px dashed ${col}55`, borderRadius: "var(--radius-sm)", background: "transparent", color: col, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add {isPros ? "advantage" : "trade-off"}</button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                      <p style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 4px" }}>{pathway.title}</p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                        {pathway.career?.title && <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.25)" }}>Career: {pathway.career.title}</span>}
                        {pathway.type && <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, background: "var(--color-bg-secondary)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}>{pathway.type}</span>}
                        {pathway.durationLabel && <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, background: "var(--color-bg-secondary)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}>⏱ {pathway.durationLabel}</span>}
                        {pathway.earnWhileLearn && <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.3)" }}>Earn while you learn</span>}
                      </div>
                    </div>
                    {(pathway.estimatedCostMin || pathway.estimatedCostMax || pathway.costNote) && (
                      <div style={{ padding: "12px", background: "var(--color-bg-secondary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Estimated cost</p>
                        {(pathway.estimatedCostMin || pathway.estimatedCostMax) && (
                          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 4px" }}>
                            {pathway.estimatedCostMin ? `R${Number(pathway.estimatedCostMin).toLocaleString()}` : ""}
                            {pathway.estimatedCostMin && pathway.estimatedCostMax ? " – " : ""}
                            {pathway.estimatedCostMax ? `R${Number(pathway.estimatedCostMax).toLocaleString()} /yr` : "/yr"}
                          </p>
                        )}
                        {pathway.costNote && <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>{pathway.costNote}</p>}
                      </div>
                    )}
                    {[
                      { label: "Entry requirements",   value: pathway.entryRequirements   },
                      { label: "Qualification earned", value: pathway.qualificationEarned },
                      { label: "Employment note",      value: pathway.employmentNote      },
                      { label: "Funding options",      value: Array.isArray(pathway.fundingOptions) && pathway.fundingOptions.length > 0 ? pathway.fundingOptions.join(", ") : null },
                      { label: "SETA",                 value: pathway.setaName            },
                    ].filter(f => f.value).map(({ label, value }) => (
                      <div key={label}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</p>
                        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.7, margin: 0 }}>{value}</p>
                      </div>
                    ))}
                    {Array.isArray(pathway.steps) && pathway.steps.length > 0 && (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Journey steps</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {pathway.steps.map((s: any, i: number) => (
                            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                              <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--color-accent)", color: "var(--color-accent-text)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 2px" }}>{s.title ?? s.step}</p>
                                {s.description && <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>{s.description}</p>}
                                {s.duration && <p style={{ fontSize: 11, color: "var(--color-accent)", margin: "2px 0 0", fontWeight: 600 }}>⏱ {s.duration}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {(Array.isArray(pathway.pros) && pathway.pros.length > 0 || Array.isArray(pathway.cons) && pathway.cons.length > 0) && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {[{ label: "✓ Advantages", items: pathway.pros, col: "#16a34a", bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.2)" }, { label: "✗ Trade-offs", items: pathway.cons, col: "#b91c1c", bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.2)" }].map(({ label, items, col, bg, border }) => (
                          Array.isArray(items) && items.length > 0 ? (
                            <div key={label} style={{ padding: "10px 12px", background: bg, border: `1px solid ${border}`, borderRadius: "var(--radius-sm)" }}>
                              <p style={{ fontSize: 11, fontWeight: 700, color: col, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                              {items.map((item: string, i: number) => <p key={i} style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 2px" }}>{item}</p>)}
                            </div>
                          ) : null
                        ))}
                      </div>
                    )}
                    {pathway.sourceUrl && (
                      <button onClick={() => openUrl(pathway.sourceUrl!)} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        📄 View source
                      </button>
                    )}
                  </div>
                )}
              </Card>
              <Card title="What to check">
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {["Pathway type matches the actual route (University / TVET / Learnership / Direct)", "Career link is correct", "Duration and cost are realistic for this route in South Africa", "Entry requirements are accurate for Grade 9–12 learners", "Journey steps are in a logical order and achievable", "Funding options are real and applicable to this pathway", "Pros and cons are honest and balanced"].map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: 10 }}><span style={{ color: "#22c55e", fontWeight: 700 }}>✓</span><span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{c}</span></div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* ── Assessment question panel ── */}
          {question && (() => {
            const RIASEC = ["R", "I", "A", "S", "E", "C"];
            const riasecColor: Record<string, string> = { R: "#ef4444", I: "#3b82f6", A: "#f59e0b", S: "#22c55e", E: "#8b5cf6", C: "#f97316" };
            return (
              <>
                <Card
                  title="Assessment question"
                  action={
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {qSaveMsg && <span style={{ fontSize: 12, color: qSaveMsg.includes("✓") ? "#22c55e" : "#ef4444", fontWeight: 500 }}>{qSaveMsg}</span>}
                      {qEditing ? (
                        <>
                          <Btn label={qSaving ? "Saving…" : "Save changes"} onClick={saveQuestion} small />
                          <Btn label="Cancel" onClick={() => { setQEditing(false); }} variant="ghost" small />
                        </>
                      ) : (
                        <Btn label="✏ Edit" onClick={() => setQEditing(true)} variant="ghost" small />
                      )}
                    </div>
                  }
                >
                  {qEditing ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {/* Question text */}
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Question text</label>
                        <textarea
                          value={qData.questionText}
                          onChange={(e) => setQData({ ...qData, questionText: e.target.value })}
                          rows={3}
                          style={{ width: "100%", padding: "8px 10px", fontSize: 14, fontWeight: 500, background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", resize: "vertical", outline: "none", boxSizing: "border-box" }}
                        />
                      </div>

                      {/* Options */}
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Answer options</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {qData.options.map((opt, i) => (
                            <div key={i} style={{ padding: "10px 12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", display: "flex", flexDirection: "column", gap: 8 }}>
                              {/* Option text */}
                              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", minWidth: 20 }}>#{i + 1}</span>
                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) => {
                                    const opts = [...qData.options];
                                    opts[i] = { ...opts[i], text: e.target.value };
                                    setQData({ ...qData, options: opts });
                                  }}
                                  placeholder="Option text…"
                                  style={{ flex: 1, padding: "6px 10px", fontSize: 13, background: "var(--color-bg-primary, var(--color-bg))", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none" }}
                                />
                                <button
                                  onClick={() => setQData({ ...qData, options: qData.options.filter((_, j) => j !== i) })}
                                  title="Remove option"
                                  style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: "#dc2626", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                                >
                                  ×
                                </button>
                              </div>
                              {/* RIASEC picker + score */}
                              <div style={{ display: "flex", gap: 8, alignItems: "center", paddingLeft: 28 }}>
                                <span style={{ fontSize: 11, color: "var(--color-text-muted)", marginRight: 2 }}>RIASEC:</span>
                                {RIASEC.map((code) => {
                                  const active = opt.value === code;
                                  const col = riasecColor[code];
                                  return (
                                    <button
                                      key={code}
                                      onClick={() => {
                                        const opts = [...qData.options];
                                        opts[i] = { ...opts[i], value: code };
                                        setQData({ ...qData, options: opts });
                                      }}
                                      style={{
                                        width: 28, height: 28, borderRadius: "50%", border: `2px solid ${active ? col : "var(--color-border)"}`,
                                        background: active ? col + "22" : "transparent", color: active ? col : "var(--color-text-muted)",
                                        fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.12s",
                                      }}
                                    >
                                      {code}
                                    </button>
                                  );
                                })}
                                <span style={{ fontSize: 11, color: "var(--color-text-muted)", marginLeft: 8 }}>Score:</span>
                                <input
                                  type="number"
                                  value={opt.score}
                                  min={0} max={5}
                                  onChange={(e) => {
                                    const opts = [...qData.options];
                                    opts[i] = { ...opts[i], score: Number(e.target.value) };
                                    setQData({ ...qData, options: opts });
                                  }}
                                  style={{ width: 52, padding: "4px 8px", fontSize: 12, background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none" }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Add option */}
                        <button
                          onClick={() => setQData({ ...qData, options: [...qData.options, { text: "", value: "R", score: 1 }] })}
                          style={{ marginTop: 10, width: "100%", padding: "8px", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-sm)", background: "transparent", color: "var(--color-text-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                        >
                          + Add option
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      {/* Type + RIASEC */}
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {question.assessmentType && <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "rgba(236,72,153,0.1)", color: "#be185d", border: "1px solid rgba(236,72,153,0.25)" }}>{question.assessmentType}</span>}
                        {Array.isArray(question.riasecMapping) && question.riasecMapping.map((code: string) => (
                          <span key={code} style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.25)" }}>{code}</span>
                        ))}
                        <span style={{ fontSize: 11, color: "var(--color-text-muted)", padding: "4px 0" }}>Question #{question.orderIndex}</span>
                      </div>
                      <div style={{ padding: "16px", background: "var(--color-bg-secondary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                        <p style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.6, margin: 0 }}>{question.questionText}</p>
                      </div>
                      {question.contextNote && (
                        <div style={{ padding: "10px 12px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "#6366f1" }}>
                          ℹ️ Context: {question.contextNote}
                        </div>
                      )}
                      {Array.isArray(question.options) && question.options.length > 0 && (
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Answer options</p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {question.options.map((opt: any, i: number) => {
                              const col = riasecColor[opt.value] ?? "#6366f1";
                              return (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--color-bg-secondary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                                  <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{opt.label ?? opt.text}</span>
                                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                    {opt.value && <span style={{ fontSize: 11, fontWeight: 700, width: 24, height: 24, borderRadius: "50%", background: col + "22", color: col, border: `1.5px solid ${col}55`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{opt.value}</span>}
                                    {opt.score !== undefined && <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>score: {opt.score}</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
                <Card title="What to check">
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {["Question is clear and understandable for a Grade 9–12 South African learner", "SA context is appropriate and relatable", "Answer options are distinct and cover the full range of response", "RIASEC mapping is correct for each answer option", "No leading or biased language in the question text", "Options are balanced — no single 'obviously right' answer"].map((c, i) => (
                      <div key={i} style={{ display: "flex", gap: 10 }}><span style={{ color: "#22c55e", fontWeight: 700 }}>✓</span><span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{c}</span></div>
                    ))}
                  </div>
                </Card>
              </>
            );
          })()}

          {/* ── Career panel ── */}
          {career && (
            <>
              <Card
                title="Career profile"
                action={
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {saveMsg && <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 500 }}>{saveMsg}</span>}
                    {editing ? (
                      <>
                        <Btn label={saving ? "Saving…" : "Save changes"} onClick={saveEdits} small />
                        <Btn label="Cancel" onClick={() => setEditing(false)} variant="ghost" small />
                      </>
                    ) : (
                      <Btn label="✏ Edit" onClick={() => setEditing(true)} variant="ghost" small />
                    )}
                  </div>
                }
              >
                {editing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {[
                      { key: "title",         label: "Title",             rows: 1 },
                      { key: "overview",      label: "Overview",          rows: 5 },
                      { key: "dayInTheLife",  label: "Day in the life",   rows: 4 },
                      { key: "howToGetThere", label: "How to get there",  rows: 4 },
                      { key: "saContext",     label: "SA context",        rows: 3 },
                    ].map(({ key, label, rows }) => (
                      <div key={key}>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                          {label}
                        </label>
                        {rows === 1 ? (
                          <input
                            type="text"
                            value={editData[key] ?? ""}
                            onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                            style={{ width: "100%", padding: "8px 10px", fontSize: "13px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }}
                          />
                        ) : (
                          <textarea
                            value={editData[key] ?? ""}
                            onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                            rows={rows}
                            style={{ width: "100%", padding: "8px 10px", fontSize: "13px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", resize: "vertical", outline: "none", boxSizing: "border-box" }}
                          />
                        )}
                      </div>
                    ))}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      {[
                        { key: "earningsMin", label: "Earnings min (ZAR/yr)" },
                        { key: "earningsMax", label: "Earnings max (ZAR/yr)" },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{label}</label>
                          <input
                            type="number"
                            value={editData[key] ?? ""}
                            onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                            style={{ width: "100%", padding: "8px 10px", fontSize: "13px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Title</p>
                      <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{career.title}</p>
                      {career.cluster?.name && <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "3px" }}>{career.cluster.name}</p>}
                    </div>
                    {(career.earningsMin || career.earningsMax) && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        {[
                          ["Earnings min", career.earningsMin ? `R${Number(career.earningsMin).toLocaleString()}/yr` : "—"],
                          ["Earnings max", career.earningsMax ? `R${Number(career.earningsMax).toLocaleString()}/yr` : "—"],
                        ].map(([label, val]) => (
                          <div key={String(label)} style={{ padding: "10px", background: "var(--color-bg-secondary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                            <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "2px" }}>{label}</p>
                            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{val}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {[
                      { label: "Overview",         value: career.overview      },
                      { label: "Day in the life",  value: career.dayInTheLife  },
                      { label: "How to get there", value: career.howToGetThere },
                      { label: "SA context",       value: career.saContext     },
                    ].filter(s => s.value).map(({ label, value }) => (
                      <div key={label}>
                        <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{label}</p>
                        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card title="Verification checklist">
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    "Title matches a real South African career",
                    "Description is factually correct and appropriate for Grade 9–12 learners",
                    "Key duties reflect actual work performed in this role",
                    "APS score range is realistic based on university requirements",
                    "Salary range is current and sourced from credible SA data",
                    "No hallucinated institutions, statistics, or qualifications",
                    "Language is clear and accessible (not overly technical)",
                  ].map((check, i) => (
                    <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <span style={{ color: "#22c55e", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{check}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>

        {/* ── Right: decision ───────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Card title={isCompleted ? "Edit decision" : "Your decision"}>
            {isCompleted && (
              <div style={{ padding: "8px 12px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-sm)", fontSize: "12px", color: "#6366f1", marginBottom: "14px", display: "flex", alignItems: "center", gap: 6 }}>
                ✏️ You already submitted this review. Change your decision below and re-publish if needed.
              </div>
            )}

            {error && (
              <div style={{ padding: "10px 12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", fontSize: "12px", color: "#ef4444", marginBottom: "12px" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "8px" }}>Decision *</p>
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["VERIFIED", "DISCARDED"] as const).map((d) => {
                    const isVerify  = d === "VERIFIED";
                    const active    = decision === d;
                    const col       = isVerify ? "#22c55e" : "#ef4444";
                    return (
                      <button
                        key={d}
                        onClick={() => setDecision(d)}
                        style={{
                          flex: 1, padding: "12px 8px",
                          border: `2px solid ${active ? col : "var(--color-border)"}`,
                          background: active ? `${col}12` : "var(--color-bg-secondary)",
                          borderRadius: "var(--radius-sm)", fontSize: "13px", fontWeight: 700,
                          color: active ? col : "var(--color-text-muted)",
                          cursor: "pointer", transition: "all 0.15s", lineHeight: 1.3,
                        }}
                      >
                        {isVerify ? "✓ Verify" : "✗ Discard"}
                        <br />
                        <span style={{ fontSize: "10px", fontWeight: 400, opacity: 0.7 }}>
                          {isVerify ? "Publish as verified" : "Archive permanently"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "6px" }}>Confidence score</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {CONFIDENCE_LEVELS.map(({ label, value }) => (
                    <label key={value} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input type="radio" name="confidence" value={value} checked={confidence === value} onChange={() => setConfidence(value)} />
                      <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "4px" }}>
                  Notes <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span>
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={decision === "DISCARDED"
                    ? "What was wrong? This will be logged against the discard."
                    : "Any observations for the content record…"}
                  rows={3}
                  style={{ width: "100%", padding: "8px 10px", fontSize: "12px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", resize: "vertical", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Save draft — available while not yet published (PENDING / IN_PROGRESS / DRAFT) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {!isCompleted && (
                  <button
                    onClick={saveDraft}
                    disabled={drafting}
                    style={{
                      padding: "10px", borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg-secondary)",
                      color: "var(--color-text-secondary)",
                      fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {drafting ? "Saving…" : draftMsg || "💾 Save draft"}
                  </button>
                )}

                {/* Publish / re-publish */}
                <button
                  onClick={submit}
                  disabled={!decision || submitting}
                  style={{
                    padding: "11px", borderRadius: "var(--radius-sm)", border: "none",
                    cursor: decision ? "pointer" : "not-allowed",
                    background: !decision ? "var(--color-bg-subtle)" : decision === "VERIFIED" ? "#22c55e" : "#ef4444",
                    color: !decision ? "var(--color-text-muted)" : "#fff",
                    fontSize: "14px", fontWeight: 700, transition: "all 0.15s",
                  }}
                >
                  {submitting ? "Submitting…"
                    : !decision ? "Select a decision first"
                    : isCompleted || submitDone
                      ? (decision === "VERIFIED" ? "✓ Re-publish as verified" : "✗ Re-discard content")
                      : (decision === "VERIFIED" ? "✓ Verify & publish" : "✗ Discard content")}
                </button>

                {/* Submitted ✓ banner + Next / Finish prompt */}
                {submitDone && (
                  <div style={{
                    padding: "14px 16px",
                    background: decision === "VERIFIED" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                    border: `1.5px solid ${decision === "VERIFIED" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                    borderRadius: "var(--radius-sm)",
                    display: "flex", flexDirection: "column", gap: 10,
                  }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: decision === "VERIFIED" ? "#16a34a" : "#dc2626" }}>
                      {decision === "VERIFIED" ? "✓ Verified and published" : "✗ Content discarded"}
                    </p>
                    {currentIdx >= 0 && currentIdx < siblingIds.length - 1 ? (
                      <button
                        onClick={goNext}
                        style={{
                          padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "none",
                          background: "var(--color-accent)", color: "#fff",
                          fontSize: 13, fontWeight: 700, cursor: "pointer",
                        }}
                      >
                        Next → ({currentIdx + 2} of {siblingIds.length})
                      </button>
                    ) : (
                      <button
                        onClick={() => router.push("/reviewer")}
                        style={{
                          padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "none",
                          background: "var(--color-accent)", color: "#fff",
                          fontSize: 13, fontWeight: 700, cursor: "pointer",
                        }}
                      >
                        ← Back to queue
                      </button>
                    )}
                  </div>
                )}

                {/* Take offline — only for completed reviews */}
                {isCompleted && (
                  <button
                    onClick={takeOffline}
                    disabled={submitting}
                    style={{
                      padding: "11px", borderRadius: "var(--radius-sm)", border: "1.5px solid rgba(239,68,68,0.4)",
                      cursor: "pointer", background: "rgba(239,68,68,0.06)",
                      color: "#dc2626", fontSize: "13px", fontWeight: 600, transition: "all 0.15s",
                    }}
                  >
                    ↩ Take offline (revert to draft)
                  </button>
                )}
              </div>
            </div>
          </Card>

          <Card title="Assignment details">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", color: "var(--color-text-muted)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Status</span><span>{statusBadge(review.status)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Content type</span>
                <span style={{ color: "var(--color-text-secondary)", textTransform: "capitalize" }}>{review.contentType?.toLowerCase()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Assigned</span>
                <span style={{ color: "var(--color-text-secondary)" }}>{new Date(review.assignedAt ?? review.createdAt).toLocaleDateString("en-ZA")}</span>
              </div>
              {review.dueAt && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Due</span>
                  <span style={{ color: new Date(review.dueAt) < new Date() ? "#ef4444" : "var(--color-text-secondary)" }}>
                    {new Date(review.dueAt).toLocaleDateString("en-ZA")}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
