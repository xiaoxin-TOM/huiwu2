"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MeetingStaffAuthorizeForm({ meetingTitle }: { meetingTitle: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function startConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setConfirming(true);
  }

  async function confirm() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/meeting-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "授权失败");
      setEmail("");
      setConfirming(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "授权失败");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirming) {
    return (
      <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm leading-relaxed text-amber-900">
          您当前所在会议为 <strong>{meetingTitle}</strong>，当前指定用户邮箱为 <strong>{email}</strong>
          。您授权后，本用户将知晓本会议全部内容，可以实行本会议管理的全部权限，请您在此核对相关内容，核实无误后，点击确认按钮。
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={submitting}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            {submitting ? "授权中..." : "确认"}
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              setError("");
            }}
            disabled={submitting}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            取消
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={startConfirm} className="flex flex-wrap gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="输入要授权用户的邮箱"
        className="min-w-64 flex-1 rounded-lg border px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800"
      >
        + 授权用户
      </button>
    </form>
  );
}
