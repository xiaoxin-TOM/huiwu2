"use client";

import { useState } from "react";

export function DownloadQrButton({
  meetingId,
  prefix,
  label,
  fileName,
}: {
  meetingId: string;
  prefix: "/r" | "/m";
  label: string;
  fileName: string;
}) {
  const [loading, setLoading] = useState(false);
  const relativeUrl = `${prefix}/${meetingId}`;

  async function handleClick() {
    setLoading(true);
    try {
      const fullUrl = `${window.location.origin}${relativeUrl}`;
      const res = await fetch(`/api/qr?text=${encodeURIComponent(fullUrl)}`);
      if (!res.ok) throw new Error("二维码生成失败");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // 静默失败，避免阻断用户操作
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="text-xs text-sky-700 hover:underline disabled:opacity-50"
      title={relativeUrl}
    >
      {loading ? "生成中…" : label}
    </button>
  );
}
