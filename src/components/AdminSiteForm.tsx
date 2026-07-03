"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SiteConfigValues {
  confName?: string | null;
  confDate?: string | null;
  confLocation?: string | null;
  logoUrl?: string | null;
  liveUrl?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  venueLng?: string | null;
  venueLat?: string | null;
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
        会场名称
        <input
          name="venueName"
          defaultValue={defaultValues.venueName ?? ""}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      <label className="block text-sm text-gray-600">
        会场地址
        <input
          name="venueAddress"
          defaultValue={defaultValues.venueAddress ?? ""}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm text-gray-600">
          会场经度
          <input
            name="venueLng"
            defaultValue={defaultValues.venueLng ?? ""}
            placeholder="116.397"
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block text-sm text-gray-600">
          会场纬度
          <input
            name="venueLat"
            defaultValue={defaultValues.venueLat ?? ""}
            placeholder="39.909"
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
      </div>
      <p className="text-xs text-gray-400">
        坐标可在
        <a
          href="https://lbs.amap.com/tools/picker"
          target="_blank"
          rel="noreferrer"
          className="text-sky-700 underline"
        >
          高德坐标拾取器
        </a>
        中点选复制(经纬度填写后前台会场交通页将显示地图与导航按钮)
      </p>
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
