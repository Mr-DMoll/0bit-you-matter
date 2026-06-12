"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Send, ThumbsUp, ThumbsDown, ArrowDown } from "lucide-react";
import apiClient from "@/api/client";

const T = {
  primary:   "#5B4FCF",
  secondary: "#EEE9FF",
  teal:      "#0D9488",
  bg:        "#FAFAF9",
  card:      "#FFFFFF",
  fg:        "#1A1535",
  muted:     "#7A7499",
  border:    "rgba(91,79,207,0.12)",
  green:     "#16A34A",
  red:       "#DC2626",
};

const SUGGESTIONS = [
  "What should I be doing in Grade 10 to prepare for my career goal?",
  "What's the difference between a TVET college and university?",
  "How does NSFAS work and do I qualify?",
  "What careers are good if I have Mathematical Literacy?",
];

// ── Markdown renderer ─────────────────────────────────────────────────────────
// Handles: ## headings, **bold**, *italic*, ---, bullet/numbered lists, tables
function isTableRow(line: string) {
  return line.trim().startsWith("|") && line.trim().endsWith("|");
}
function isSeparatorRow(line: string) {
  return /^\|[\s\-:|]+\|[\s\-:|]*$/.test(line.trim());
}
function parseTableRow(line: string): string[] {
  return line.trim().slice(1, -1).split("|").map((c) => c.trim());
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      out.push(<hr key={i} style={{ border: "none", borderTop: `1px solid ${T.border}`, margin: "10px 0" }} />);
      i++;
      continue;
    }

    // H2
    if (line.startsWith("## ")) {
      out.push(
        <p key={i} style={{ margin: "12px 0 4px", fontSize: 14, fontWeight: 800, color: T.fg }}>
          {inlineRender(line.slice(3))}
        </p>,
      );
      i++;
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      out.push(
        <p key={i} style={{ margin: "10px 0 2px", fontSize: 13, fontWeight: 700, color: T.fg }}>
          {inlineRender(line.slice(4))}
        </p>,
      );
      i++;
      continue;
    }

    // Table — collect all consecutive table rows
    if (isTableRow(line)) {
      const tableLines: string[] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      // First row = header, second row = separator (skip), rest = body
      const [headerRow, , ...bodyRows] = tableLines;
      const headers = parseTableRow(headerRow ?? "");
      const rows    = bodyRows.filter((r) => !isSeparatorRow(r)).map(parseTableRow);

      out.push(
        <div key={`tbl-${i}`} style={{ overflowX: "auto", margin: "10px 0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {headers.map((h, j) => (
                  <th key={j} style={{
                    padding: "8px 12px", textAlign: "left",
                    background: T.secondary, color: T.primary,
                    fontWeight: 700, fontSize: 12,
                    borderBottom: `2px solid ${T.primary}22`,
                    whiteSpace: "nowrap",
                  }}>
                    {inlineRender(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} style={{ background: ri % 2 === 0 ? T.card : T.bg }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{
                      padding: "8px 12px", color: T.fg,
                      borderBottom: `1px solid ${T.border}`,
                      verticalAlign: "top",
                    }}>
                      {inlineRender(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // Bullet
    if (/^[\-•*]\s/.test(line.trim())) {
      const bulletLines: string[] = [];
      while (i < lines.length && /^[\-•*]\s/.test(lines[i].trim())) {
        bulletLines.push(lines[i].trim().replace(/^[\-•*]\s/, ""));
        i++;
      }
      out.push(
        <ul key={`ul-${i}`} style={{ margin: "4px 0", paddingLeft: 18 }}>
          {bulletLines.map((b, j) => (
            <li key={j} style={{ fontSize: 14, lineHeight: 1.7, color: T.fg, marginBottom: 2 }}>
              {inlineRender(b)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line.trim())) {
      const numLines: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        numLines.push(lines[i].trim().replace(/^\d+\.\s/, ""));
        i++;
      }
      out.push(
        <ol key={`ol-${i}`} style={{ margin: "4px 0", paddingLeft: 20 }}>
          {numLines.map((b, j) => (
            <li key={j} style={{ fontSize: 14, lineHeight: 1.7, color: T.fg, marginBottom: 2 }}>
              {inlineRender(b)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // Empty line → spacing
    if (line.trim() === "") {
      out.push(<div key={i} style={{ height: 6 }} />);
      i++;
      continue;
    }

    // Normal paragraph
    out.push(
      <p key={i} style={{ margin: "2px 0", fontSize: 14, lineHeight: 1.7, color: T.fg }}>
        {inlineRender(line)}
      </p>,
    );
    i++;
  }

  return out;
}

// Inline: **bold**, *italic*
function inlineRender(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i}>{part.slice(1, -1)}</em>;
    return <span key={i}>{part}</span>;
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id:        string;
  role:      "user" | "assistant";
  content:   string;
  reaction?: string | null;
  createdAt?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function GuidanceChatPage() {
  const searchParams  = useSearchParams();
  const autoPrompt    = searchParams.get("prompt");

  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [user,      setUser]      = useState<any>(null);

  const [atBottom,  setAtBottom]  = useState(true);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const scrollRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef    = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  // Track whether user is near the bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAtBottom(distFromBottom < 80);
  }, []);

  const autoPromptFiredRef = useRef(false);

  // Load user + history on mount — jump instantly to bottom after load
  useEffect(() => {
    Promise.all([
      apiClient.get("/users/me").then((r) => r.data.data.user).catch(() => null),
      apiClient.get("/learner/chat/history").then((r) => r.data.data).catch(() => []),
    ]).then(([u, hist]) => {
      setUser(u);
      setMessages(Array.isArray(hist) ? hist : []);
      setTimeout(() => scrollToBottom("instant" as ScrollBehavior), 50);
      // Auto-send ?prompt= query param once after load
      if (autoPrompt && !autoPromptFiredRef.current) {
        autoPromptFiredRef.current = true;
        setTimeout(() => sendMessage(autoPrompt), 300);
      }
    }).finally(() => setLoading(false));
  }, []);

  // Auto-scroll only when user is already at the bottom
  useEffect(() => {
    if (atBottom) scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const initials = user
    ? (user.firstName?.[0] ?? user.email?.[0] ?? "?").toUpperCase()
    : "?";

  // ── Send message ─────────────────────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    setInput("");
    setTimeout(() => {
      if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
    }, 0);

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "", reaction: null }]);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const rawToken = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const token    = rawToken ? `Bearer ${rawToken}` : "";
      const apiBase  = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

      const res = await fetch(`${apiBase}/learner/chat/message`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json", Authorization: token },
        body:        JSON.stringify({ message: trimmed }),
        signal:      ctrl.signal,
        credentials: "include",
      });

      const reader = res.body!.getReader();
      const dec    = new TextDecoder();
      let   buf    = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(part.slice(6));
            if (data.token) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + data.token } : m,
                ),
              );
            }
            if (data.error) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: "Sorry, something went wrong. Please try again." }
                    : m,
                ),
              );
            }
          } catch {}
        }
      }

      // After streaming completes, fetch the real DB id so reactions work
      const hist = await apiClient.get("/learner/chat/history").then((r) => r.data.data).catch(() => null);
      if (Array.isArray(hist) && hist.length > 0) {
        const lastAssistant = [...hist].reverse().find((m: Message) => m.role === "assistant");
        if (lastAssistant) {
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, id: lastAssistant.id } : m),
          );
        }
      }

    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Could not reach the server. Please check your connection." }
              : m,
          ),
        );
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      textareaRef.current?.focus();
    }
  };

  // ── React to message ──────────────────────────────────────────────────────────
  const react = async (msgId: string, reaction: "up" | "down") => {
    const prevReaction = messages.find((m) => m.id === msgId)?.reaction ?? null;
    setMessages((prev) =>
      prev.map((m) => m.id !== msgId ? m : { ...m, reaction: m.reaction === reaction ? null : reaction }),
    );
    try {
      const res = await apiClient.patch(`/learner/chat/${msgId}/reaction`, { reaction });
      const next = res.data.data.reaction;
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, reaction: next } : m));
    } catch {
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, reaction: prevReaction } : m));
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const showSuggestions = messages.length === 0 && !loading;

  if (loading) return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 14 }}>
      <div style={{ width: 28, height: 28, border: `3px solid ${T.primary}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginRight: 12 }} />
      Loading your chat…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="chat-wrapper" style={{ background: T.bg, height: "100svh", display: "flex", flexDirection: "column", fontFamily: "inherit" }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${T.border}`, background: T.card, flexShrink: 0 }}>
        <div style={{ padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #5B4FCF 0%, #0D9488 100%)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
            ✨
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.fg }}>Ask AI</p>
            <p style={{ margin: 0, fontSize: 12, color: T.teal, fontWeight: 600 }}>● AI-powered career guide</p>
          </div>
        </div>
        {/* Always-visible capability strip */}
        <div style={{ padding: "8px 24px 10px", borderTop: `1px solid ${T.border}`, background: T.secondary, display: "flex", gap: 16, overflowX: "auto", scrollbarWidth: "none" }}>
          {[
            { icon: "🎓", text: "Which career suits me?" },
            { icon: "📚", text: "What subjects do I need?" },
            { icon: "💰", text: "How do I get a bursary?" },
            { icon: "🏫", text: "Which university should I apply to?" },
            { icon: "📋", text: "What is my APS score?" },
          ].map(({ icon, text }) => (
            <button
              key={text}
              onClick={() => sendMessage(text)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, background: T.card, border: `1px solid ${T.border}`, fontSize: 12, color: T.fg, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
            >
              <span>{icon}</span> {text}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="chat-scroll"
        style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, position: "relative" }}
      >

        {showSuggestions && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 520, margin: "0 auto", width: "100%", paddingTop: 20 }}>
            <div style={{ background: T.card, borderRadius: 16, padding: "18px 20px", border: `1px solid ${T.border}` }}>
              <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: T.fg }}>Hi! I'm an AI career guide ✨</p>
              <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                Ask me anything about careers, bursaries, subjects, or university applications in South Africa. I know your profile so my advice is specific to you.
              </p>
            </div>
            <p style={{ margin: "8px 0 4px", fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Suggested questions</p>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                style={{
                  textAlign: "left", padding: "11px 16px", borderRadius: 12,
                  border: `1.5px solid ${T.border}`, background: T.card,
                  fontSize: 13, color: T.fg, cursor: "pointer", lineHeight: 1.5,
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.primary; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div key={msg.id} className="chat-msg-row" style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: 4 }}>
              <div className={isUser ? "chat-bubble-user" : "chat-bubble-ai"} style={{ display: "flex", alignItems: "flex-end", gap: 8, maxWidth: "76%", alignSelf: isUser ? "flex-end" : "flex-start" }}>

                {!isUser && (
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #5B4FCF 0%, #0D9488 100%)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                    ✨
                  </div>
                )}

                <div style={{
                  background: isUser ? T.primary : T.card,
                  color:      isUser ? "#fff"    : T.fg,
                  border:     isUser ? "none"    : `1px solid ${T.border}`,
                  borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  padding:    "10px 14px",
                  whiteSpace: isUser ? "pre-wrap" : undefined,
                  fontSize:   14,
                  lineHeight: 1.65,
                }}>
                  {isUser
                    ? msg.content
                    : msg.content
                      ? renderMarkdown(msg.content)
                      : <span style={{ opacity: 0.45, fontSize: 18 }}>▌</span>
                  }
                </div>

                {isUser && (
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: T.secondary, color: T.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                    {initials}
                  </div>
                )}
              </div>

              {/* Reactions — only on assistant messages that are fully rendered */}
              {!isUser && msg.content && !streaming && (
                <div style={{ display: "flex", gap: 6, paddingLeft: 38 }}>
                  <button
                    onClick={() => react(msg.id, "up")}
                    title="Helpful"
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "3px 10px", borderRadius: 20, border: `1px solid ${msg.reaction === "up" ? T.green : T.border}`,
                      background: msg.reaction === "up" ? "#F0FDF4" : "transparent",
                      color: msg.reaction === "up" ? T.green : T.muted,
                      cursor: "pointer", fontSize: 12, transition: "all 0.15s",
                    }}
                  >
                    <ThumbsUp size={13} fill={msg.reaction === "up" ? T.green : "none"} />
                    Helpful
                  </button>
                  <button
                    onClick={() => react(msg.id, "down")}
                    title="Not helpful"
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "3px 10px", borderRadius: 20, border: `1px solid ${msg.reaction === "down" ? T.red : T.border}`,
                      background: msg.reaction === "down" ? "#FEF2F2" : "transparent",
                      color: msg.reaction === "down" ? T.red : T.muted,
                      cursor: "pointer", fontSize: 12, transition: "all 0.15s",
                    }}
                  >
                    <ThumbsDown size={13} fill={msg.reaction === "down" ? T.red : "none"} />
                    Not helpful
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Scroll-to-bottom button */}
      {!atBottom && (
        <div style={{ position: "sticky", bottom: 12, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
          <button
            onClick={() => { scrollToBottom(); setAtBottom(true); }}
            style={{
              pointerEvents: "all",
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 16px", borderRadius: 20,
              background: T.primary, color: "#fff",
              border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600,
              boxShadow: "0 4px 12px rgba(91,79,207,0.35)",
              transition: "opacity 0.2s",
            }}
          >
            <ArrowDown size={14} />
            Back to bottom
          </button>
        </div>
      )}

      {/* Input */}
      <div className="chat-input-bar" style={{ padding: "12px 24px 20px", background: T.card, borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
        <p className="chat-hint" style={{ margin: "0 0 6px", fontSize: 11, color: T.muted }}>Enter to send · Shift+Enter for new line</p>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Ask about careers, bursaries, subjects…"
            value={input}
            onChange={(e) => { setInput(e.target.value); resizeTextarea(); }}
            onKeyDown={handleKey}
            disabled={streaming}
            style={{
              flex: 1, padding: "11px 16px",
              border: `1.5px solid ${T.border}`,
              borderRadius: 12, fontSize: 14, color: T.fg,
              background: streaming ? "#f5f5f5" : T.bg,
              outline: "none", resize: "none",
              fontFamily: "inherit", lineHeight: 1.6,
              transition: "border-color 0.15s",
              overflow: "hidden",
            }}
            onFocus={(e) => { e.target.style.borderColor = T.primary; }}
            onBlur={(e) => { e.target.style.borderColor = T.border; }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            style={{
              background: input.trim() && !streaming ? T.primary : T.secondary,
              color:      input.trim() && !streaming ? "#fff" : T.muted,
              border: "none", borderRadius: 12,
              width: 44, height: 44,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: input.trim() && !streaming ? "pointer" : "default",
              flexShrink: 0, transition: "background 0.15s",
            }}
          >
            {streaming
              ? <div style={{ width: 16, height: 16, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              : <Send size={18} />
            }
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1023px) {
          .chat-wrapper  { height: calc(100svh - 72px) !important; }
          .chat-input-bar { padding-bottom: max(16px, env(safe-area-inset-bottom)) !important; }
          .chat-hint     { display: none !important; }
          .chat-scroll   { padding: 16px 12px !important; }
          .chat-bubble-ai  { max-width: 92% !important; }
          .chat-bubble-user { max-width: 88% !important; }
        }
      `}</style>
    </div>
  );
}
