"use client";

import { useState } from "react";

export default function ConfirmButton({ token }: { token: string }) {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/guests/${token}/confirm`, { method: "POST" });
      if (res.ok) {
        setConfirmed(true);
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "确认失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  if (confirmed) {
    return <p className="rounded-lg bg-emerald-100 py-3 text-emerald-700">确认成功，期待您的到来！</p>;
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-lg bg-sky-700 px-6 py-3 text-white hover:bg-sky-800 disabled:opacity-50"
      >
        {loading ? "提交中..." : "确认出席"}
      </button>
    </div>
  );
}
