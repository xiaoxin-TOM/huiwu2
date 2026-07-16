"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploadField from "@/components/ImageUploadField";

interface SiteConfigValues {
  confName?: string | null;
  confDate?: string | null;
  confLocation?: string | null;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  liveUrl?: string | null;
  venueAddress?: string | null;
  venueLng?: string | null;
  venueLat?: string | null;
  welcomeHtml?: string | null;
  footerHtml?: string | null;
}

export default function AdminSiteForm({ defaultValues }: { defaultValues: SiteConfigValues }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
        setSuccess("保存成功");
        setTimeout(() => setSuccess(""), 3000);
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
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white px-8 py-6 shadow-xl">
            <div className="mb-4 text-center text-2xl text-green-600">✓</div>
            <p className="text-center text-lg font-medium text-gray-800">{success}</p>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="mt-6 w-full rounded bg-sky-700 px-4 py-2 text-white hover:bg-sky-800"
            >
              确定
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          会场地址
          <input
            name="venueAddress"
            defaultValue={defaultValues.venueAddress ?? ""}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
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
        <p className="col-span-1 text-xs text-gray-400 sm:col-span-2">
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
        <div className="col-span-1 sm:col-span-2">
          <ImageUploadField name="logoUrl" defaultValue={defaultValues.logoUrl ?? ""} label="Logo 图片地址" />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <ImageUploadField
            name="heroImageUrl"
            defaultValue={defaultValues.heroImageUrl ?? ""}
            label="首页头图/宣传海报地址"
            placeholder="上传图片后自动填写，也可粘贴图片地址，建议比例 16:9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            rows={6}
            defaultValue={defaultValues.footerHtml ?? ""}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
          />
        </label>
      </div>

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
