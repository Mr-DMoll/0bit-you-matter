"use client";

import { useRouter } from "next/navigation";

interface ChatLinkProps {
  prompt:   string;
  children: React.ReactNode;
  style?:   React.CSSProperties;
}

/**
 * Wraps any text/element so that clicking it opens the Career Guide
 * chat with the given prompt pre-filled and auto-sent.
 *
 * Usage:
 *   <ChatLink prompt="What does RIASEC mean?">RIASEC</ChatLink>
 */
export function ChatLink({ prompt, children, style }: ChatLinkProps) {
  const router = useRouter();
  return (
    <span
      onClick={() => router.push("/learner/chat?prompt=" + encodeURIComponent(prompt))}
      title="Ask Career Guide →"
      style={{
        color: "#5B4FCF",
        fontWeight: 600,
        cursor: "pointer",
        textDecoration: "underline dotted",
        textUnderlineOffset: 3,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
