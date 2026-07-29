"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function FeedbackReplyForm({
  id,
  status,
  existingReply,
}: {
  id: string;
  status: string;
  existingReply: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState(existingReply);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function post(body: Record<string, string>) {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      for (const [k, v] of Object.entries(body)) form.append(k, v);
      const res = await fetch(`/api/admin/feedback/${id}`, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || "操作失败");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" size="xs" onClick={() => setOpen(true)}>
          {status === "RESOLVED" ? "修改回复" : "回复"}
        </Button>
        {status === "RESOLVED" && (
          <Button variant="secondary" size="xs" disabled={busy} onClick={() => void post({ action: "reopen" })}>
            重新打开
          </Button>
        )}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="回复内容，用户可在「我的反馈」中看到"
        className="w-full rounded border px-2 py-1 text-sm"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button variant="primary" size="xs" disabled={busy} onClick={() => void post({ action: "reply", reply })}>
          {busy ? "提交中…" : "提交回复"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          取消
        </Button>
      </div>
    </div>
  );
}
