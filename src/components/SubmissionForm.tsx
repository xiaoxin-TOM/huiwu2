"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SubmissionForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const form = e.currentTarget;
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        body: new FormData(form),
      });
      const data = await res.json().catch(() => ({ ok: false, error: "服务器错误" }));
      if (!data.ok) {
        setError(data.error ?? "提交失败");
        return;
      }
      form.reset();
      router.refresh();
    } catch {
      setError("网络错误,请重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-3">
      <input name="title" required placeholder="论文题目" className="w-full rounded border px-3 py-2" />
      <input name="authors" required placeholder="作者(多位用、分隔)" className="w-full rounded border px-3 py-2" />
      <textarea name="abstract" required placeholder="摘要" rows={4} className="w-full rounded border px-3 py-2" />
      <input name="file" type="file" accept="application/pdf" required className="w-full text-sm" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="rounded bg-sky-700 px-4 py-2 text-white disabled:opacity-50">
        {submitting ? "提交中…" : "提交论文"}
      </button>
    </form>
  );
}
