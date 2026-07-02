"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SiteConfigValues {
  confName?: string | null;
  confDate?: string | null;
  confLocation?: string | null;
  logoUrl?: string | null;
  liveUrl?: string | null;
  welcomeHtml?: string | null;
  footerHtml?: string | null;
}

export default function AdminSiteForm({ defaultValues }: { defaultValues: SiteConfigValues }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/site", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        router.push(data.redirectTo ?? "/admin");
        router.refresh();
        return;
      }

      let msg = "保存失败";
      try {
        const data = await res.json();
        if (data.error) msg = data.error;
      } catch {
        // ignore parse error
      }
      setError(msg);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input type="hidden" name="redirectTo" value="/admin" />
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}
      <label className="block text-sm text-gray-600">
        会议名称
        <input
          name="confName"
          required
          defaultValue={defaultValues.confName ?? ""}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      <label className="block text-sm text-gray-600">
        会议时间
        <input
          name="confDate"
          defaultValue={defaultValues.confDate ?? ""}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      <label className="block text-sm text-gray-600">
        会议地点
        <input
          name="confLocation"
          defaultValue={defaultValues.confLocation ?? ""}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      <label className="block text-sm text-gray-600">
        Logo 图片地址
        <input
          name="logoUrl"
          defaultValue={defaultValues.logoUrl ?? ""}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      <label className="block text-sm text-gray-600">
        直播地址(外部链接)
        <input
          name="liveUrl"
          defaultValue={defaultValues.liveUrl ?? ""}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      <label className="block text-sm text-gray-600">
        欢迎致辞（纯文本，换行自动分段）
        <textarea
          name="welcomeHtml"
          rows={6}
          defaultValue={defaultValues.welcomeHtml ?? ""}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-sm text-gray-600">
        页脚内容（纯文本，每行一段）
        <textarea
          name="footerHtml"
          rows={4}
          defaultValue={defaultValues.footerHtml ?? ""}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-sky-700 px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "保存中..." : "保存"}
      </button>
    </form>
  );
}
