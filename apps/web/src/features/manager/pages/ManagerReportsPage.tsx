"use client";

import { useState } from "react";
import apiClient from "@/api/client";
import { PageHeader, Card, Btn } from "@/features/admin/components/AdminShell";

export function ManagerReportsPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const exportReport = async (type: string) => {
    setLoading(type);
    try {
      const res = await apiClient.get("/manager/reports/learners");
      const { learners, completionRates } = res.data.data;

      let csv = "";

      if (type === "progress") {
        csv = "Email,First name,Last name,Grade,Province,School,Interest,Aptitude,Personality,Values,RIASEC,Chosen career,Last active\n";
        csv += learners.map((l: any) => {
          const done = (t: string) => l.assessmentSessions.some((s: any) => s.assessmentType === t && s.status === "COMPLETED") ? "Yes" : "No";
          return [
            l.email, l.firstName ?? "", l.lastName ?? "",
            l.grade ?? "", l.province ?? "", l.school ?? "",
            done("INTEREST"), done("APTITUDE"), done("PERSONALITY"), done("VALUES"),
            l.learnerProfile?.riasecType ?? "",
            l.learnerProfile?.chosenCareerId ? "Set" : "Not set",
            l.lastActiveAt ?? "",
          ].join(",");
        }).join("\n");
      } else {
        csv = "Assessment,Completion rate (%)\n";
        for (const [key, val] of Object.entries(completionRates)) {
          csv += `${key},${val}\n`;
        }
      }

      const blob = new Blob([csv], { type: "text/csv" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `you-matter-manager-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader title="Reports" subtitle="Export your cohort's progress and assessment data" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
        <Card>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "6px" }}>Learner Progress Report</p>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "16px" }}>
            All learners with assessment completion status, RIASEC type, chosen career, and last-active date.
          </p>
          <Btn label={loading === "progress" ? "Exporting…" : "Export CSV"} onClick={() => exportReport("progress")} variant="ghost" />
        </Card>

        <Card>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "6px" }}>Completion Rate Summary</p>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "16px" }}>
            Percentage of your cohort who have completed each of the four assessments.
          </p>
          <Btn label={loading === "rates" ? "Exporting…" : "Export CSV"} onClick={() => exportReport("rates")} variant="ghost" />
        </Card>
      </div>
    </div>
  );
}
