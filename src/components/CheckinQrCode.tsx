"use client";

import { useMemo } from "react";

export default function CheckinQrCode({ token }: { token: string }) {
  const src = useMemo(() => {
    if (typeof window === "undefined") return "";
    const checkinUrl = `${window.location.origin}/checkin?token=${token}`;
    return `/api/qr?text=${encodeURIComponent(checkinUrl)}`;
  }, [token]);

  if (!src) return <div className="h-40 w-40 animate-pulse rounded-lg bg-slate-200" />;

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
      <p className="mb-2 text-sm font-medium text-slate-700">签到二维码</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="签到二维码" className="mx-auto h-40 w-40" />
      <p className="mt-2 text-xs text-slate-400">现场签到时请出示此二维码</p>
    </div>
  );
}
