"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const T = {
  primary:   "#5B4FCF",
  secondary: "#EEE9FF",
  border:    "rgba(91,79,207,0.12)",
  muted:     "#7A7499",
};

interface InfoBannerProps {
  id:      string;   // unique key stored in localStorage
  icon:    string;
  title:   string;
  body:    string;
  tip?:    string;   // optional bold tip line
}

export function InfoBanner({ id, icon, title, body, tip }: InfoBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(`banner-dismissed-${id}`);
    if (!dismissed) setVisible(true);
  }, [id]);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(`banner-dismissed-${id}`, "1");
    setVisible(false);
  };

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 14,
      background: T.secondary,
      border: `1px solid ${T.border}`,
      borderRadius: 14,
      padding: "14px 16px",
      marginBottom: 20,
      position: "relative",
    }}>
      <span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 700, color: "#1A1535" }}>{title}</p>
        <p style={{ margin: 0, fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{body}</p>
        {tip && (
          <p style={{ margin: "6px 0 0", fontSize: 12, color: T.primary, fontWeight: 600 }}>💡 {tip}</p>
        )}
      </div>
      <button
        onClick={dismiss}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0, color: T.muted }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
