"use client";

import { useState } from "react";
import { amapNavUrl, type VenueLocation } from "@/lib/venue";

export default function VenueNavButton({ venue }: { venue: VenueLocation }) {
  const [locating, setLocating] = useState(false);

  async function handleClick() {
    if (locating) return;
    setLocating(true);
    // 同步先开一个空白窗口,避免异步后再调用 window.open 被浏览器拦截为弹窗
    const win = window.open("", "_blank");
    if (win) win.opener = null;
    try {
      if (!navigator.geolocation) throw new Error("当前浏览器不支持定位");
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      const url = amapNavUrl(venue, {
        lng: position.coords.longitude,
        lat: position.coords.latitude,
        name: "我的位置",
      });
      if (win) {
        win.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch {
      const url = amapNavUrl(venue);
      if (win) {
        win.location.href = url;
      } else {
        window.location.href = url;
      }
    } finally {
      setLocating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={locating}
      className="rounded bg-sky-700 px-4 py-2 text-sm text-white hover:bg-sky-800 disabled:opacity-60"
    >
      {locating ? "定位中..." : "🧭 导航到会场"}
    </button>
  );
}
