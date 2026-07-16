"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BadgeTemplate } from "@prisma/client";
import ImageUploadField from "@/components/ImageUploadField";

interface AdminBadgeTemplateFormProps {
  defaultValues: BadgeTemplate;
}

function PreviewButton() {
  const [previewing, setPreviewing] = useState(false);

  async function handlePreview() {
    setPreviewing(true);
    try {
      const res = await fetch("/api/admin/badges/preview", { method: "POST" });
      if (!res.ok) {
        let msg = "预览失败";
        try {
          const data = await res.json();
          if (data.error) msg = data.error;
        } catch {
          // ignore
        }
        alert(msg);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      alert("网络错误，请重试");
    } finally {
      setPreviewing(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handlePreview}
      disabled={previewing}
      className="rounded border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      {previewing ? "生成中..." : "预览胸卡"}
    </button>
  );
}

function ResetButton() {
  const router = useRouter();
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    if (!confirm("确定要恢复默认模板吗？当前自定义的模板设置将被清除。")) {
      return;
    }
    setResetting(true);
    try {
      const res = await fetch("/api/admin/badge-template", { method: "DELETE" });
      if (!res.ok) {
        let msg = "恢复失败";
        try {
          const data = await res.json();
          if (data.error) msg = data.error;
        } catch {
          // ignore
        }
        alert(msg);
        return;
      }
      router.refresh();
    } catch {
      alert("网络错误，请重试");
    } finally {
      setResetting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleReset}
      disabled={resetting}
      className="rounded border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      {resetting ? "恢复中..." : "恢复默认"}
    </button>
  );
}

export default function AdminBadgeTemplateForm({ defaultValues }: AdminBadgeTemplateFormProps) {
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
      const res = await fetch("/api/admin/badge-template", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setSuccess("模板保存成功");
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

  type NumericField =
    | "pageWidthMm"
    | "pageHeightMm"
    | "nameX"
    | "nameY"
    | "nameSize"
    | "titleX"
    | "titleY"
    | "titleSize"
    | "companyX"
    | "companyY"
    | "companySize"
    | "qrX"
    | "qrY"
    | "qrSize"
    | "meetingTitleX"
    | "meetingTitleY"
    | "meetingTitleSize";

  const numericField = (name: NumericField, label: string, step = 1) => (
    <label className="block text-sm text-gray-600">
      {label}
      <input
        name={name}
        type="number"
        step={step}
        required
        defaultValue={defaultValues[name]}
        className="mt-1 w-full rounded border px-3 py-2"
      />
    </label>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {numericField("pageWidthMm", "页面宽度（mm）")}
        {numericField("pageHeightMm", "页面高度（mm）")}
        <div className="sm:col-span-2 lg:col-span-1">
          <ImageUploadField name="bgImageUrl" defaultValue={defaultValues.bgImageUrl ?? ""} label="背景图片 URL" placeholder="https://example.com/badge-bg.png" />
        </div>
      </div>

      <div className="space-y-4 rounded-lg bg-slate-50 p-4">
        <h3 className="font-semibold text-gray-700">会议标题</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {numericField("meetingTitleX", "X（mm）")}
          {numericField("meetingTitleY", "Y（mm）")}
          {numericField("meetingTitleSize", "字号（px）")}
        </div>
      </div>

      <div className="space-y-4 rounded-lg bg-slate-50 p-4">
        <h3 className="font-semibold text-gray-700">姓名</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {numericField("nameX", "X（mm）")}
          {numericField("nameY", "Y（mm）")}
          {numericField("nameSize", "字号（px）")}
        </div>
      </div>

      <div className="space-y-4 rounded-lg bg-slate-50 p-4">
        <h3 className="font-semibold text-gray-700">职位 / 职称</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {numericField("titleX", "X（mm）")}
          {numericField("titleY", "Y（mm）")}
          {numericField("titleSize", "字号（px）")}
        </div>
      </div>

      <div className="space-y-4 rounded-lg bg-slate-50 p-4">
        <h3 className="font-semibold text-gray-700">单位 / 组织</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {numericField("companyX", "X（mm）")}
          {numericField("companyY", "Y（mm）")}
          {numericField("companySize", "字号（px）")}
        </div>
      </div>

      <div className="space-y-4 rounded-lg bg-slate-50 p-4">
        <h3 className="font-semibold text-gray-700">寸照区域</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {numericField("qrX", "X（mm）")}
          {numericField("qrY", "Y（mm）")}
          {numericField("qrSize", "边长（mm）")}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-sky-700 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "保存中..." : "保存模板"}
        </button>
        <PreviewButton />
        <ResetButton />
        <a
          href="/api/admin/badges/export"
          download
          className="rounded border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          导出胸卡 PDF
        </a>
      </div>
    </form>
  );
}
