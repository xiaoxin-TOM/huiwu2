"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export type NotificationRow = {
  id: string;
  title: string;
  body: string;
  linkHref: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationList({
  notifications,
  markAllHref,
}: {
  notifications: NotificationRow[];
  markAllHref: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const unread = notifications.filter((n) => !n.isRead).length;

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    router.refresh();
  }

  async function markAll() {
    setBusy(true);
    try {
      await fetch(markAllHref, { method: "POST" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (notifications.length === 0) {
    return <p className="text-sm text-slate-500">暂无通知。</p>;
  }

  return (
    <div className="space-y-3">
      {unread > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {unread} 条未读
          </span>
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => void markAll()}>
            {busy ? "处理中…" : "全部标记已读"}
          </Button>
        </div>
      )}

      <div className="divide-y rounded-xl bg-white shadow-sm">
        {notifications.map((n) => (
          <div key={n.id} className={`flex flex-wrap items-start justify-between gap-3 p-4 ${n.isRead ? "" : "bg-sky-50/50"}`}>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-medium text-slate-800">
                {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-sky-600" aria-label="未读" />}
                {n.title}
              </p>
              <p className="mt-1 text-sm text-slate-600">{n.body}</p>
              <p className="mt-1 text-xs text-slate-400">{n.createdAt}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {n.linkHref && (
                <Link
                  href={n.linkHref}
                  onClick={() => void markRead(n.id)}
                  className="rounded-lg bg-sky-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-sky-800"
                >
                  查看
                </Link>
              )}
              {!n.isRead && (
                <Button variant="ghost" onClick={() => void markRead(n.id)}>
                  标记已读
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
