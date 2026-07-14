"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, buttonClass, labelClass } from "@/components/ui/Card";

export default function SubmissionForm({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append("meetingId", meetingId);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({ ok: false, error: "服务器错误" }));
      if (!data.ok) {
        setError(data.error ?? "提交失败");
        return;
      }
      form.reset();
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <div>
        <label className={labelClass}>论文题目</label>
        <input name="title" required placeholder="请输入论文题目" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>作者</label>
        <input name="authors" required placeholder="多位作者请用、分隔" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>摘要</label>
        <textarea name="abstract" required placeholder="请输入摘要" rows={4} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>PDF 文件</label>
        <input
          name="file"
          type="file"
          accept="application/pdf"
          required
          className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:font-medium file:text-sky-700 hover:file:bg-sky-100"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className={buttonClass}>
        {submitting ? "提交中…" : "提交论文"}
      </button>
    </form>
  );
}
