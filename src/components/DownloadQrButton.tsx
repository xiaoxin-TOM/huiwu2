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
      const QRCode = await import("qrcode");
      const dataUrl = await QRCode.toDataURL(fullUrl, { width: 256, margin: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${fileName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
