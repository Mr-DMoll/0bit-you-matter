"use client";

import { useState } from "react";
import { Send } from "lucide-react";

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

const MOCK_MESSAGES = [
  {
    role: "user",
    text: "What subjects do I need to become a software engineer?",
  },
  {
    role: "ai",
    text: "To pursue software engineering, you'll need strong foundations in:\n\n• **Mathematics** (at least 70%) — essential for algorithms, data structures, and systems design.\n• **Physical Sciences** — useful but not always required.\n• **IT/Computer Applications Technology (CAT)** — gives you early exposure to programming.\n\nTop universities like UCT and Wits require an APS of 36+. Start practicing coding on platforms like Khan Academy or Scratch now!",
  },
  {
    role: "user",
    text: "Are there any bursaries available for tech students?",
  },
  {
    role: "ai",
    text: "Yes! Here are 2 great options for tech learners:\n\n1. **Investec STEM Bursary** — covers up to R80,000/year. Requires Maths 70%+. Deadline: 31 Jul 2026.\n\n2. **MTN Digital Innovation Bursary** — covers up to R65,000/year. Requires Maths & Science 70%+. Deadline: 15 Jul 2026.\n\nBoth are available in the Bursaries section of your app. Would you like tips on writing a strong bursary application?",
  },
];

export function GuidanceChatPage() {
  const [input, setInput] = useState("");

  return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.border}`, background: T.card }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: T.fg }}>Career Guide</h1>
        <p style={{ margin: 0, fontSize: 13, color: T.muted }}>Ask me anything about careers, bursaries or studies</p>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {MOCK_MESSAGES.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
              {!isUser && (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginRight: 10, alignSelf: "flex-end" }}>
                  AI
                </div>
              )}
              <div
                style={{
                  maxWidth: "70%",
                  background: isUser ? T.primary : T.card,
                  color: isUser ? "#fff" : T.fg,
                  border: isUser ? "none" : `1px solid ${T.border}`,
                  borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  padding: "12px 16px",
                  fontSize: 14,
                  lineHeight: 1.6,
                  whiteSpace: "pre-line",
                }}
              >
                {msg.text}
              </div>
              {isUser && (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.secondary, color: T.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, marginLeft: 10, alignSelf: "flex-end" }}>
                  TM
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Input bar */}
      <div style={{ padding: "12px 24px 24px", background: T.card, borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="text"
            placeholder="Ask about careers, bursaries, subjects..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              flex: 1,
              padding: "12px 16px",
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              fontSize: 14,
              color: T.fg,
              background: T.bg,
              outline: "none",
            }}
          />
          <button
            style={{
              background: T.primary,
              color: "#fff",
              border: "none",
              borderRadius: 12,
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Send size={18} />
          </button>
        </div>
        <p style={{ margin: "8px 0 0", fontSize: 11, color: T.muted, textAlign: "center" }}>
          This is a demo — messages are for illustration only.
        </p>
      </div>
    </div>
  );
}
