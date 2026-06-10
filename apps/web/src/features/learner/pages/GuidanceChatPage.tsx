"use client";

import { useState, useEffect, useRef } from "react";
import apiClient from "@/api/client";
import { Send } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "What careers suit my RIASEC type?",
  "Which universities offer engineering in Gauteng?",
  "How do I improve my APS score?",
  "What bursaries are available for Grade 12?",
  "What does a software developer do day-to-day?",
];

export function GuidanceChatPage() {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const history = messages.slice(-8); // send last 8 for context
      const res = await apiClient.post("/learner/chat/message", {
        message: text.trim(),
        history,
      });
      const reply: Message = { role: "assistant", content: res.data.data.reply };
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100svh - 130px)" }}>

      <div style={{ marginBottom: "12px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-text-primary)" }}>Guidance Chat</h1>
        <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
          Ask me anything about careers, universities or bursaries
        </p>
      </div>

      {/* ── Message feed ── */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "8px" }}>
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingTop: "8px" }}>
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: "40px", marginBottom: "8px" }}>💬</div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>I'm your career guide</p>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px" }}>Powered by AI — here to help you find your path</p>
            </div>
            <div>
              <p style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Try asking</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    style={{
                      padding: "10px 14px",
                      background: "var(--color-bg-secondary)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "10px",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "13px",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display:       "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div style={{
              maxWidth:     "85%",
              padding:      "10px 14px",
              borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background:   m.role === "user" ? "var(--color-accent)" : "var(--color-bg-secondary)",
              border:       m.role === "user" ? "none" : "1px solid var(--color-border)",
              fontSize:     "14px",
              lineHeight:   1.5,
              color:        m.role === "user" ? "#fff" : "var(--color-text-primary)",
              whiteSpace:   "pre-wrap",
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ padding: "10px 14px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "16px 16px 16px 4px", display: "flex", gap: "4px", alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-text-muted)", animation: `bounce 1s ${i * 0.15}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={{
        display:      "flex",
        gap:          "8px",
        alignItems:   "flex-end",
        padding:      "10px 0 4px",
        borderTop:    "1px solid var(--color-border)",
        marginTop:    "8px",
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask anything…"
          rows={1}
          style={{
            flex:         1,
            padding:      "10px 14px",
            fontSize:     "14px",
            background:   "var(--color-bg-secondary)",
            border:       "1px solid var(--color-border)",
            borderRadius: "12px",
            color:        "var(--color-text-primary)",
            outline:      "none",
            resize:       "none",
            lineHeight:   1.4,
            maxHeight:    "100px",
            overflowY:    "auto",
          }}
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          style={{
            width:        "40px",
            height:       "40px",
            borderRadius: "50%",
            background:   input.trim() && !loading ? "var(--color-accent)" : "var(--color-border)",
            border:       "none",
            cursor:       input.trim() && !loading ? "pointer" : "not-allowed",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
            flexShrink:   0,
            transition:   "background 0.15s",
          }}
        >
          <Send size={16} color="#fff" />
        </button>
      </div>

      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-4px)} }`}</style>
    </div>
  );
}
