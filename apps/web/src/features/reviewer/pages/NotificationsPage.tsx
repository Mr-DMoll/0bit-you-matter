"use client";

import { useState, useEffect } from "react";
import apiClient from "@/api/client";
import {
  PageHeader, Card, Spinner, Empty, Btn, timeAgo,
} from "@/features/admin/components/AdminShell";

type Notification = {
  id: string;
  type: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
};

const TYPE_ICON: Record<string, string> = {
  REVIEW_ASSIGNED:   "📋",
  REVIEW_OVERDUE:    "⚠️",
  CONTENT_APPROVED:  "✅",
  CONTENT_REJECTED:  "❌",
  SYSTEM:            "🔔",
};

const TYPE_COLOR: Record<string, string> = {
  REVIEW_ASSIGNED:   "#6366f1",
  REVIEW_OVERDUE:    "#ef4444",
  CONTENT_APPROVED:  "#22c55e",
  CONTENT_REJECTED:  "#ef4444",
  SYSTEM:            "#94a3b8",
};

export function ReviewerNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/learner/notifications")
      .then((r) => setNotifications(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    try {
      await apiClient.patch("/learner/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const markRead = async (id: string) => {
    try {
      await apiClient.patch(`/learner/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up"}
        action={unreadCount > 0 ? <Btn label="Mark all read" onClick={markAllRead} variant="ghost" small /> : undefined}
      />

      <Card noPad>
        {loading ? <Spinner /> : notifications.length === 0 ? (
          <Empty message="No notifications yet" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {notifications.map((n, idx) => (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                style={{
                  display: "flex", gap: "14px", padding: "14px 20px",
                  background: n.read ? "transparent" : "rgba(99,102,241,0.03)",
                  borderBottom: idx < notifications.length - 1 ? "1px solid var(--color-border)" : "none",
                  cursor: n.read ? "default" : "pointer",
                  transition: "background 0.15s",
                }}
              >
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: `${TYPE_COLOR[n.type] ?? "#94a3b8"}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                  {TYPE_ICON[n.type] ?? "🔔"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", color: n.read ? "var(--color-text-secondary)" : "var(--color-text-primary)", fontWeight: n.read ? 400 : 500, lineHeight: 1.4 }}>
                    {n.message}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "3px" }}>
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
                {!n.read && (
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6366f1", flexShrink: 0, marginTop: "4px" }} />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
