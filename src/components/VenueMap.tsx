"use client";

import { useEffect, useRef, useState } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";

type Props = { lng: number; lat: number; name: string; address: string };

// 高德地图实例仅需 destroy 能力,不引入完整类型定义
type AMapInstance = { destroy: () => void };

export default function VenueMap({ lng, lat, name, address }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const key = process.env.NEXT_PUBLIC_AMAP_KEY;

  useEffect(() => {
    if (!key || !containerRef.current) return;
    const securityCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE;
    if (securityCode) {
      (window as unknown as { _AMapSecurityConfig: { securityJsCode: string } })._AMapSecurityConfig =
        { securityJsCode: securityCode };
    }
    let map: AMapInstance | undefined;
    let cancelled = false;
    AMapLoader.load({ key, version: "2.0" })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 高德 JS API 无类型定义
      .then((AMap: any) => {
        if (cancelled || !containerRef.current) return;
        map = new AMap.Map(containerRef.current, { center: [lng, lat], zoom: 15 });
        const marker = new AMap.Marker({ position: [lng, lat], title: name });
        (map as unknown as { add: (m: unknown) => void }).add(marker);
        // 信息窗内容用 DOM 构建,避免管理员输入被当作 HTML 注入
        const content = document.createElement("div");
        content.style.padding = "4px 8px";
        const strong = document.createElement("strong");
        strong.textContent = name;
        content.append(strong);
        if (address) content.append(document.createElement("br"), address);
        const info = new AMap.InfoWindow({ content, offset: new AMap.Pixel(0, -30) });
        marker.on("click", () => info.open(map, [lng, lat]));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      map?.destroy();
    };
  }, [key, lng, lat, name, address]);

  if (!key || failed) return null;
  return <div ref={containerRef} className="h-80 w-full rounded-xl bg-slate-100" />;
}
