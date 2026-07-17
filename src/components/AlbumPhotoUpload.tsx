"use client";

import { useState } from "react";
import { ImageIcon } from "@/components/icons";

interface AlbumPhotoUploadProps {
  albumId: string;
}

export default function AlbumPhotoUpload({ albumId }: AlbumPhotoUploadProps) {
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setMessage("请选择图片");
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/albums/${albumId}/photos`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "上传失败");
      setMessage("上传成功");
      form.reset();
      setFileName("");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className="mb-4 flex flex-wrap items-end gap-3"
    >
      <label
        className={`cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 ${uploading ? "pointer-events-none opacity-50" : ""}`}
      >
        <span className="flex items-center gap-1.5">
          <ImageIcon className="h-4 w-4" />
          {uploading ? "上传中..." : "选择图片上传"}
        </span>
        <input
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          disabled={uploading}
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
        />
      </label>
      <input
        name="caption"
        placeholder="说明（可选）"
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      />
      <button
        type="submit"
        disabled={uploading}
        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-50"
      >
        上传
      </button>
      {fileName && (
        <span className="w-full text-sm text-slate-500">
          已选择：{fileName}
        </span>
      )}
      {message && (
        <span className={`w-full text-sm ${message.includes("失败") ? "text-red-500" : "text-emerald-600"}`}>
          {message}
        </span>
      )}
    </form>
  );
}
