"use client";

import { useState } from "react";
import { ImageIcon } from "@/components/icons";

interface AlbumPhotoUploadProps {
  albumId: string;
}

export default function AlbumPhotoUpload({ albumId }: AlbumPhotoUploadProps) {
  const [fileName, setFileName] = useState("");

  return (
    <form
      action={`/api/admin/albums/${albumId}/photos`}
      method="post"
      encType="multipart/form-data"
      className="mb-4 flex flex-wrap items-end gap-3"
    >
      <label className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700">
        <span className="flex items-center gap-1.5">
          <ImageIcon className="h-4 w-4" />
          选择图片上传
        </span>
        <input
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
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
        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
      >
        上传
      </button>
      {fileName && (
        <span className="w-full text-sm text-slate-500">
          已选择：{fileName}
        </span>
      )}
    </form>
  );
}
