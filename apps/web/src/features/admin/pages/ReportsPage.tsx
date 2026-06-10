"use client";

import { useState } from "react";
import apiClient from "@/api/client";
import { PageHeader, Card, Btn } from "../components/AdminShell";

export function AdminReportsPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const downloadReport = async (type: string, label: string) => {
    setLoading(type);
    try {
      const endpoint = type === "learners" ? "/admin/learners?page=1" : "/content/reviews?page=1";
      const res = await apiClient.get(endpoint);
      const data = res.data.data;

      // Convert to CSV
      let csv = "";
      if (type === "learners") {
        const users = data.users ?? [];
        csv = "Email,First name,Last name,Grade,Province,School,Status,Last active\n";
        csv += users.map((u: any) =>
          [u.email, u.firstName ?? "", u.lastName ?? "", u.grade ?? "", u.province ?? "", u.school ?? "", u.accountStatus, u.lastActiveAt ?? ""].join(",")
        ).join("\n");
      } else {
        const reviews = data.reviews ?? [];
        csv = "Content type,Content,Reviewer,Status,Assigned,Due\n";
        csv += reviews.map((r: any) =>
          [r.contentType, r.career?.title ?? r.question?.questionText?.slice(0, 40) ?? "", r.reviewer?.email ?? "", r.status, r.assignedAt, r.dueAt ?? ""].join(",")
        ).join("\n");
      }

      const blob = new Blob([csv], { type: "text/csv" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `you-matter-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
    } finally {
      setLoading(null);
    }
  };

  const reports = [
    {
      id:    "learners",
      title: "Learner Directory",
      desc:  "All learner accounts with grade, province, school, status and last-active date.",
    },
    {
      id:    "reviews",
      title: "Review Queue Report",
      desc:  "All content review assignments with reviewer, status, assigned and due dates.",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader title="Reports" subtitle="Export learner and content data to CSV" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
        {reports.map((r) => (
          <Card key={r.id}>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "6px" }}>{r.title}</p>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "16px" }}>{r.desc}</p>
            <Btn
              label={loading === r.id ? "Exporting…" : "Export CSV"}
              onClick={() => downloadReport(r.id, r.title)}
              variant="ghost"
            />
          </Card>
        ))}
      </div>

      <Card title="Coming soon">
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            "Assessment completion rates by province",
            "Career exploration patterns — most saved careers",
            "Content coverage report — verified vs AI-generated",
            "Bursary engagement — saves and deadline alerts",
            "Reviewer performance — approval rates and turnaround time",
          ].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>◦</span>
              <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{item}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
