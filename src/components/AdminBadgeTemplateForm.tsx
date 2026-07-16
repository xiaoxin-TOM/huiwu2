"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BadgeTemplate } from "@prisma/client";
import ImageUploadField from "@/components/ImageUploadField";

interface AdminBadgeTemplateFormProps {
  defaultValues: BadgeTemplate;
}

const MM_TO_PX = 3.78;

function mmToPx(mm: number): number {
  return Math.round(mm * MM_TO_PX);
}

function parseFormNumber(form: HTMLFormElement, name: string): number {
  const value = form.elements.namedItem(name);
  if (value instanceof HTMLInputElement) {
    const num = Number(value.value);
    return Number.isNaN(num) ? 0 : num;
  }
  return 0;
}

interface PreviewData {
  pageWidthMm: number;
  pageHeightMm: number;
  bgImageUrl: string;
  labelGapMm: number;
  nameX: number;
  nameY: number;
  nameSize: number;
  titleX: number;
  titleY: number;
  titleSize: number;
  companyX: number;
  companyY: number;
  companySize: number;
  qrX: number;
  qrY: number;
  qrSize: number;
  meetingTitleX: number;
  meetingTitleY: number;
  meetingTitleSize: number;
}

function readPreviewData(form: HTMLFormElement): PreviewData {
  const textValue = (name: string) => {
    const el = form.elements.namedItem(name);
    return el instanceof HTMLInputElement ? el.value : "";
  };
  return {
    pageWidthMm: parseFormNumber(form, "pageWidthMm"),
    pageHeightMm: parseFormNumber(form, "pageHeightMm"),
    bgImageUrl: textValue("bgImageUrl"),
    labelGapMm: parseFormNumber(form, "labelGapMm"),
    nameX: parseFormNumber(form, "nameX"),
    nameY: parseFormNumber(form, "nameY"),
    nameSize: parseFormNumber(form, "nameSize"),
    titleX: parseFormNumber(form, "titleX"),
    titleY: parseFormNumber(form, "titleY"),
    titleSize: parseFormNumber(form, "titleSize"),
    companyX: parseFormNumber(form, "companyX"),
    companyY: parseFormNumber(form, "companyY"),
    companySize: parseFormNumber(form, "companySize"),
    qrX: parseFormNumber(form, "qrX"),
    qrY: parseFormNumber(form, "qrY"),
    qrSize: parseFormNumber(form, "qrSize"),
    meetingTitleX: parseFormNumber(form, "meetingTitleX"),
    meetingTitleY: parseFormNumber(form, "meetingTitleY"),
    meetingTitleSize: parseFormNumber(form, "meetingTitleSize"),
  };
}

function PreviewButton() {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);

  function handlePreview() {
    const form = document.getElementById("badge-template-form") as HTMLFormElement | null;
    if (!form) return;
    setPreview(readPreviewData(form));
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handlePreview}
        className="rounded border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
      >
        预览胸卡
      </button>
      {open && preview && (
        <BadgePreviewModal data={preview} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function BadgePreviewModal({ data, onClose }: { data: PreviewData; onClose: () => void }) {
  const width = mmToPx(data.pageWidthMm);
  const height = mmToPx(data.pageHeightMm);
  const sample = {
    meetingTitle: "测试会议",
    fullName: "张三",
    title: "高级工程师",
    organization: "示例科技有限公司",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative flex max-h-[90vh] flex-col rounded-lg bg-white shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-2xl text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label="关闭"
        >
          ×
        </button>
        <div className="p-6 pb-2">
          <h3 className="text-lg font-semibold text-gray-800">胸卡预览</h3>
        </div>
        <div className="overflow-auto px-6 pb-6">
          <div
            className="relative mx-auto overflow-hidden border border-gray-300 bg-white"
            style={{
              width,
              height,
              backgroundImage: data.bgImageUrl ? `url(${data.bgImageUrl})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* 会议标题 */}
            <div
              className="absolute whitespace-nowrap text-center font-bold"
              style={{
                left: mmToPx(data.meetingTitleX),
                bottom: mmToPx(data.meetingTitleY),
                transform: "translateX(-50%)",
                fontSize: data.meetingTitleSize,
                lineHeight: 1,
              }}
            >
              {sample.meetingTitle}
            </div>

            {/* 有背景图时：姓名 / 职位 / 单位居中 */}
            {data.bgImageUrl && (
              <>
                <div
                  className="absolute whitespace-nowrap text-center"
                  style={{
                    left: mmToPx(data.nameX),
                    bottom: mmToPx(data.nameY),
                    transform: "translateX(-50%)",
                    fontSize: data.nameSize,
                    lineHeight: 1,
                  }}
                >
                  {sample.fullName}
                </div>
                <div
                  className="absolute whitespace-nowrap text-center"
                  style={{
                    left: mmToPx(data.titleX),
                    bottom: mmToPx(data.titleY),
                    transform: "translateX(-50%)",
                    fontSize: data.titleSize,
                    lineHeight: 1,
                  }}
                >
                  {sample.title}
                </div>
                <div
                  className="absolute whitespace-nowrap text-center"
                  style={{
                    left: mmToPx(data.companyX),
                    bottom: mmToPx(data.companyY),
                    transform: "translateX(-50%)",
                    fontSize: data.companySize,
                    lineHeight: 1,
                  }}
                >
                  {sample.organization}
                </div>
              </>
            )}

            {/* 寸照区域 */}
            <div
              className="absolute flex items-center justify-center border border-black text-center text-gray-500"
              style={{
                left: mmToPx(data.qrX) - mmToPx(data.qrSize) / 2,
                bottom: mmToPx(data.qrY) - mmToPx(data.qrSize) / 2,
                width: mmToPx(data.qrSize),
                height: mmToPx(data.qrSize),
                fontSize: Math.max(12, mmToPx(data.qrSize) / 5),
              }}
            >
              贴照片处
            </div>

            {/* 无背景图时：左侧标签 + 值 */}
            {!data.bgImageUrl && (
              <>
                <div
                  className="absolute whitespace-nowrap"
                  style={{
                    left: mmToPx(data.nameX),
                    bottom: mmToPx(data.nameY),
                    fontSize: data.nameSize,
                    lineHeight: 1,
                  }}
                >
                  {sample.fullName}
                </div>
                <div
                  className="absolute whitespace-nowrap"
                  style={{
                    left: mmToPx(data.titleX),
                    bottom: mmToPx(data.titleY),
                    fontSize: data.titleSize,
                    lineHeight: 1,
                  }}
                >
                  {sample.title}
                </div>
                <div
                  className="absolute whitespace-nowrap"
                  style={{
                    left: mmToPx(data.companyX),
                    bottom: mmToPx(data.companyY),
                    fontSize: data.companySize,
                    lineHeight: 1,
                  }}
                >
                  {sample.organization}
                </div>

                {/* 左侧标签 */}
                <div
                  className="absolute whitespace-nowrap"
                  style={{
                    left: mmToPx(data.nameX - data.labelGapMm),
                    bottom: mmToPx(data.nameY),
                    transform: "translateX(-100%)",
                    fontSize: data.nameSize,
                    lineHeight: 1,
                  }}
                >
                  姓名：
                </div>
                <div
                  className="absolute whitespace-nowrap"
                  style={{
                    left: mmToPx(data.titleX - data.labelGapMm),
                    bottom: mmToPx(data.titleY),
                    transform: "translateX(-100%)",
                    fontSize: data.titleSize,
                    lineHeight: 1,
                  }}
                >
                  职位：
                </div>
                <div
                  className="absolute whitespace-nowrap"
                  style={{
                    left: mmToPx(data.companyX - data.labelGapMm),
                    bottom: mmToPx(data.companyY),
                    transform: "translateX(-100%)",
                    fontSize: data.companySize,
                    lineHeight: 1,
                  }}
                >
                  单位：
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
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
    | "labelGapMm"
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
    <form id="badge-template-form" onSubmit={handleSubmit} className="space-y-6">
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
        {numericField("labelGapMm", "标签与值间距（mm）")}
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
