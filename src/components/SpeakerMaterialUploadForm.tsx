"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@prisma/client";
import { Button } from "@/components/ui/Button";

interface SpeakerMaterialUploadFormProps {
  sessions: Session[];
  meetingId: string;
}

export default function SpeakerMaterialUploadForm({ sessions, meetingId }: SpeakerMaterialUploadFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fileName, setFileName] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/speaker-materials", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess("上传成功");
        (e.target as HTMLFormElement).reset();
        setFileName("");
        router.refresh();
      } else {
        setError(data.error || "上传失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileName(file?.name ?? "");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="meetingId" value={meetingId} />
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
      {success && <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>}

      <div>
        <label className="block text-sm font-medium text-slate-700">选择日程</label>
        <select name="sessionId" required className="mt-1 w-full rounded border px-3 py-2 text-sm">
          <option value="">请选择</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.day} {s.startTime}-{s.endTime} {s.room && `· ${s.room} `}
              {s.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">演讲稿件</label>
        <input
          ref={fileInputRef}
          name="file"
          type="file"
          accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          required
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="mt-1 flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            选择文件
          </Button>
          <span className="text-sm text-slate-600">{fileName || "未选择文件"}</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          支持 PDF、PPT、PPTX、Word、Excel，单个文件不超过 50MB
        </p>
      </div>

      <Button type="submit" disabled={loading} variant="primary" size="md">
        {loading ? "上传中..." : "上传资料"}
      </Button>
    </form>
  );
}
