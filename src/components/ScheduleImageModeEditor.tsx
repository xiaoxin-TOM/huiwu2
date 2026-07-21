"use client";

import { useRef, useState } from "react";
import ImageUploadField from "@/components/ImageUploadField";

export default function ScheduleImageModeEditor({
  defaultMode = "TEXT",
  defaultImageUrl = "",
}: {
  defaultMode?: string;
  defaultImageUrl?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<"TEXT" | "IMAGE">(defaultMode === "IMAGE" ? "IMAGE" : "TEXT");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function save() {
    if (!formRef.current) return;
    const form = new FormData(formRef.current);
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/schedule/image-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleMode: mode,
          scheduleImageUrl: String(form.get("scheduleImageUrl") ?? ""),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "保存失败");
      setMessage({ type: "success", text: "已保存" });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "保存失败" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="space-y-3 rounded border p-4"
    >
      <h2 className="text-sm font-semibold text-slate-700">日程展示模式</h2>
      <div className="flex items-center gap-4 text-sm text-slate-600">
        <label className="flex items-center gap-1.5">
          <input type="radio" checked={mode === "TEXT"} onChange={() => setMode("TEXT")} />
          结构化日程（默认）
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" checked={mode === "IMAGE"} onChange={() => setMode("IMAGE")} />
          一图流（用一张图片代替日程列表）
        </label>
      </div>
      <div className={mode === "IMAGE" ? "" : "hidden"}>
        <ImageUploadField name="scheduleImageUrl" defaultValue={defaultImageUrl} label="日程图片" />
      </div>
      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-sky-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-sky-800 disabled:opacity-50"
      >
        {saving ? "保存中..." : "保存展示模式"}
      </button>
    </form>
  );
}
