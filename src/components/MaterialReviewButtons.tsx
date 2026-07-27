"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

/** 审核按钮。驳回要求填原因——讲者只有知道为什么才能改对再传。 */
export default function MaterialReviewButtons({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function submit(decision: "APPROVED" | "REJECTED", reviewNote = "") {
    setBusy(true);
    setError("");
    const form = new FormData();
    form.append("decision", decision);
    form.append("reviewNote", reviewNote);
    try {
      const res = await fetch(`/api/admin/speaker-materials/${id}`, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || "操作失败");
      } else {
        setRejecting(false);
        setNote("");
        router.refresh();
      }
    } catch {
      setError("网络错误");
    } finally {
      setBusy(false);
    }
  }

  if (rejecting) {
    return (
      <div className="space-y-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="驳回原因（讲者可见）"
          className="w-48 rounded border px-2 py-1 text-xs"
        />
        <div className="flex gap-2">
          <Button variant="danger" size="xs" disabled={busy} onClick={() => void submit("REJECTED", note)}>
            {busy ? "提交中…" : "确认驳回"}
          </Button>
          <Button variant="ghost" onClick={() => setRejecting(false)}>
            取消
          </Button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "APPROVED" && (
        <Button variant="primary" size="xs" disabled={busy} onClick={() => void submit("APPROVED")}>
          通过
        </Button>
      )}
      {status !== "REJECTED" && (
        <Button variant="danger" size="xs" disabled={busy} onClick={() => setRejecting(true)}>
          驳回
        </Button>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
