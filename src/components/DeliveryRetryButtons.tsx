"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

/** 无 deliveryId 时渲染"重发全部失败"，有则渲染单条重发 */
export default function DeliveryRetryButtons({
  deliveryId,
  hasFailed,
}: {
  deliveryId?: string;
  hasFailed?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function post(body: Record<string, string>) {
    setBusy(true);
    try {
      const form = new FormData();
      for (const [k, v] of Object.entries(body)) form.append(k, v);
      await fetch("/api/admin/notification-deliveries", { method: "POST", body: form });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (deliveryId) {
    return (
      <Button variant="secondary" size="xs" disabled={busy} onClick={() => void post({ action: "requeue", id: deliveryId })}>
        {busy ? "处理中…" : "立即重发"}
      </Button>
    );
  }

  if (!hasFailed) return null;

  return (
    <Button variant="secondary" size="sm" disabled={busy} onClick={() => void post({ action: "requeue-all" })}>
      {busy ? "处理中…" : "重发全部失败"}
    </Button>
  );
}
