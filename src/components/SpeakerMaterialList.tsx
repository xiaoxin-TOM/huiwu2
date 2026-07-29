"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { MATERIAL_STATUS_LABEL } from "@/types/material";

export type SpeakerMaterialListItem = {
  id: string;
  fileName: string;
  fileSize: number;
  status: string;
  reviewNote: string;
  isConfidential: boolean;
  sessionLabel: string;
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-600",
};

export default function SpeakerMaterialList({ materials }: { materials: SpeakerMaterialListItem[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  async function remove(id: string) {
    setPendingId(id);
    setError("");
    try {
      const res = await fetch(`/api/speaker-materials/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || "删除失败");
      } else {
        router.refresh();
      }
    } catch {
      setError("网络错误");
    } finally {
      setPendingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
      <div className="divide-y">
        {materials.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-medium text-slate-800">
                <span className="truncate">{m.fileName}</span>
                <span className={`rounded px-1.5 py-0.5 text-xs ${STATUS_STYLE[m.status] ?? ""}`}>
                  {MATERIAL_STATUS_LABEL[m.status] ?? m.status}
                </span>
                {m.isConfidential && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">保密</span>
                )}
              </p>
              <p className="text-xs text-slate-500">
                {m.sessionLabel} · {(m.fileSize / 1024 / 1024).toFixed(2)} MB
              </p>
              {m.status === "REJECTED" && m.reviewNote && (
                <p className="mt-1 text-xs text-red-600">驳回原因：{m.reviewNote}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`/api/materials/${m.id}/file?download=1`}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                下载查看原文
              </a>
              {m.status === "APPROVED" ? (
                <span className="text-xs text-slate-400">已通过，如需撤回请联系管理员</span>
              ) : confirmingId === m.id ? (
                <>
                  <Button
                    variant="danger"
                    size="xs"
                    disabled={pendingId === m.id}
                    onClick={() => void remove(m.id)}
                  >
                    {pendingId === m.id ? "删除中…" : "确认删除"}
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmingId(null)}>
                    取消
                  </Button>
                </>
              ) : (
                <Button variant="danger" size="xs" onClick={() => setConfirmingId(m.id)}>
                  删除
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
