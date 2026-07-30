"use client";

import { useState } from "react";

/** 平面图查看器。点击全屏放大——手机上不放大根本看不清桌号。 */
export default function SeatMapViewer({ url, note }: { url: string; note: string }) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <div className="space-y-2">
      <button type="button" onClick={() => setZoomed(true)} className="block w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="会场平面图" className="w-full rounded-lg" />
      </button>
      <p className="text-xs text-slate-500">{note || "点击图片可放大查看"}</p>

      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-slate-900/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="会场平面图"
          onClick={() => setZoomed(false)}
        >
          <div className="max-h-full max-w-full overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="会场平面图" className="min-w-[640px] max-w-none" />
          </div>
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="fixed right-4 top-4 rounded-lg bg-white/90 px-3 py-1.5 text-sm text-slate-700"
          >
            关闭
          </button>
        </div>
      )}
    </div>
  );
}
