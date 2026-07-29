"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FEEDBACK_CATEGORIES, FEEDBACK_CATEGORY_LABEL } from "@/lib/validation";

export default function FeedbackForm({
  meetingId,
  isLoggedIn,
}: {
  meetingId: string;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/feedback", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setSuccess("已收到您的反馈，我们会尽快处理");
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        setError(data.error || "提交失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="meetingId" value={meetingId} />
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
      {success && <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>}

      <div>
        <label className="block text-sm font-medium text-slate-700">反馈类型</label>
        <select name="category" defaultValue="SUGGESTION" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
          {FEEDBACK_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {FEEDBACK_CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          反馈内容 <span className="text-red-500">*</span>
        </label>
        <textarea
          name="content"
          rows={5}
          required
          maxLength={2000}
          placeholder="请描述您遇到的问题或建议，越具体我们越好处理"
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          联系方式{!isLoggedIn && <span className="text-red-500"> *</span>}
        </label>
        <input
          name="contact"
          maxLength={100}
          required={!isLoggedIn}
          placeholder="手机号或微信号"
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-slate-500">
          {isLoggedIn
            ? "选填。处理结果会通过站内通知告知您，留下联系方式可让我们更快联系上。"
            : "您当前未登录，站内收不到回复通知，请务必留下联系方式。"}
        </p>
      </div>

      <Button type="submit" variant="primary" size="md" disabled={loading}>
        {loading ? "提交中…" : "提交反馈"}
      </Button>
    </form>
  );
}
