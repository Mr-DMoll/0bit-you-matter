"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { YouMatterAnalyticsPDF, type YouMatterAnalyticsPDFProps } from "./AnalyticsPDF";

type Props = YouMatterAnalyticsPDFProps;

export function AnalyticsExportButton(props: Props) {
  const generatedAt = new Date().toLocaleDateString("en-ZA", {
    year: "numeric", month: "long", day: "numeric",
  });
  const fileName = `you-matter-analytics-${new Date().toISOString().slice(0, 10)}.pdf`;

  const doc = <YouMatterAnalyticsPDF {...props} generatedAt={generatedAt} />;

  return (
    <PDFDownloadLink document={doc} fileName={fileName}>
      {({ loading }) => (
        <button
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 18px",
            background: loading ? "var(--color-accent-subtle)" : "var(--color-accent)",
            border: "none", borderRadius: "var(--radius-md)",
            fontSize: 13, fontWeight: 700,
            color: loading ? "var(--color-accent)" : "var(--color-accent-text)",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "opacity 0.15s",
          }}
        >
          <Download size={15} />
          {loading ? "Preparing PDF…" : "Export PDF"}
        </button>
      )}
    </PDFDownloadLink>
  );
}
