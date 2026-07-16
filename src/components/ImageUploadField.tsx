"use client";

import { useState } from "react";

export default function ImageUploadField({
  name,
  defaultValue = "",
  placeholder = "上传图片后自动填写，也可粘贴图片地址",
  label = "图片地址",
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function upload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setMessage("图片不能超过 5MB");
      return;
    }
    setUploading(true);
    setMessage(null);
    const form = new FormData();
    form.set("file", file);
    try {
      const response = await fetch("/api/admin/upload/image", {
        method: "POST",
        body: form,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) throw new Error(result.error || "上传失败");
      setValue(result.url);
      setMessage("图片已上传");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm text-slate-600">
        {label}
        <input
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <label
          className={`cursor-pointer rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 ${uploading ? "pointer-events-none opacity-50" : ""}`}
        >
          {uploading ? "上传中..." : "上传图片并记录"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            className="hidden"
            onChange={(event) => {
              const input = event.currentTarget;
              const file = input.files?.[0];
              if (file) void upload(file).finally(() => { input.value = ""; });
            }}
          />
        </label>
        {value && (
          <button
            type="button"
            onClick={() => setValue("")}
            className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100"
          >
            移除图片
          </button>
        )}
        <span className="text-xs text-slate-400">JPG、PNG、WebP，最大 5MB</span>
      </div>
      {message && <p className="text-xs text-slate-500">{message}</p>}
      {value && (
        <div className="h-24 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="图片预览" className="h-full w-full object-cover" />
        </div>
      )}
    </div>
  );
}
