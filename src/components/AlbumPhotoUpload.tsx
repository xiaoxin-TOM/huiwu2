"use client";

import { useState, useRef, useCallback } from "react";
import { UploadIcon, XIcon } from "@/components/icons";

interface PendingFile {
  file: File;
  id: string;
  preview: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

interface AlbumPhotoUploadProps {
  albumId: string;
}

const ACCEPT = "image/jpeg,image/png,image/webp";

function generateId() {
  return Math.random().toString(36).slice(2);
}

export default function AlbumPhotoUpload({ albumId }: AlbumPhotoUploadProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const acceptedTypes = new Set(ACCEPT.split(","));
    const newFiles: PendingFile[] = [];
    for (let i = 0; i < incoming.length; i++) {
      const file = incoming[i];
      if (!acceptedTypes.has(file.type)) continue;
      const preview = URL.createObjectURL(file);
      newFiles.push({ file, id: generateId(), preview, status: "pending" });
    }
    setFiles((prev) => [...prev, ...newFiles]);
    setGlobalMessage(null);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  function closeModal() {
    if (uploading) return;
    setOpen(false);
    setFiles((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.preview));
      return [];
    });
    setGlobalMessage(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const pending = files.filter((f) => f.status === "pending");
    if (pending.length === 0) {
      setGlobalMessage("请选择图片");
      return;
    }

    setUploading(true);
    setGlobalMessage(null);
    setFiles((prev) =>
      prev.map((f) => (f.status === "pending" ? { ...f, status: "uploading" } : f))
    );

    const formData = new FormData();
    pending.forEach((f) => formData.append("files", f.file));

    try {
      const response = await fetch(`/api/admin/albums/${albumId}/photos`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json().catch(() => ({ ok: false, error: "上传失败" }));
      if (!response.ok && response.status !== 207) {
        throw new Error(result.error || "上传失败");
      }

      const results: Array<{ name: string; ok: boolean; error?: string }> = result.results || [];
      const resultMap = new Map(results.map((r) => [r.name, r]));

      setFiles((prev) =>
        prev.map((f) => {
          if (f.status !== "uploading") return f;
          const match = resultMap.get(f.file.name);
          if (match?.ok) return { ...f, status: "done" };
          return { ...f, status: "error", error: match?.error || "上传失败" };
        })
      );

      const successCount = results.filter((r) => r.ok).length;
      const errorCount = results.length - successCount;
      if (errorCount === 0) {
        setGlobalMessage(`成功上传 ${successCount} 张图片`);
      } else if (successCount === 0) {
        setGlobalMessage(result.error || "上传失败，请检查图片格式或大小");
      } else {
        setGlobalMessage(`上传完成：${successCount} 张成功，${errorCount} 张失败`);
      }

      if (successCount > 0) {
        window.location.reload();
      }
    } catch (error) {
      setGlobalMessage(error instanceof Error ? error.message : "上传失败");
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading" ? { ...f, status: "error", error: "上传失败" } : f
        )
      );
    } finally {
      setUploading(false);
    }
  }

  const pendingCount = files.filter((f) => f.status === "pending").length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
      >
        <UploadIcon className="h-4 w-4" />
        上传图片
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">批量上传图片</h3>
              <button
                type="button"
                onClick={closeModal}
                disabled={uploading}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => inputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${
                  isDragging
                    ? "border-sky-500 bg-sky-50"
                    : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
                }`}
              >
                <UploadIcon className="mx-auto h-10 w-10 text-slate-400" />
                <p className="mt-2 text-sm font-medium text-slate-600">点击或拖拽图片到此处</p>
                <p className="text-xs text-slate-400">支持 JPG / PNG / WebP，单张不超过 5MB</p>
                <input
                  ref={inputRef}
                  name="files"
                  type="file"
                  accept={ACCEPT}
                  multiple
                  disabled={uploading}
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {files.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {files.map((f) => (
                    <div key={f.id} className="group relative rounded-lg border border-slate-200 bg-white p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.preview} alt={f.file.name} className="h-20 w-full rounded-md object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(f.id)}
                        disabled={uploading}
                        className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white opacity-0 shadow transition group-hover:opacity-100 disabled:opacity-0"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                      <p className="mt-1 truncate text-xs text-slate-500" title={f.file.name}>
                        {f.file.name}
                      </p>
                      {f.status === "error" && <p className="text-xs text-red-500">{f.error}</p>}
                      {f.status === "uploading" && <p className="text-xs text-sky-500">上传中...</p>}
                      {f.status === "done" && <p className="text-xs text-emerald-600">完成</p>}
                    </div>
                  ))}
                </div>
              )}

              {globalMessage && (
                <p
                  className={`text-sm ${
                    globalMessage.includes("失败") ? "text-red-500" : "text-emerald-600"
                  }`}
                >
                  {globalMessage}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={uploading}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={uploading || pendingCount === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-50"
                >
                  <UploadIcon className="h-4 w-4" />
                  {uploading ? "上传中..." : `上传${pendingCount > 0 ? ` (${pendingCount})` : ""}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
