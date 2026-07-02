"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

export default function ScanCheckinPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [message, setMessage] = useState("正在初始化摄像头...");
  const [result, setResult] = useState<{ fullName: string; type?: string; checkedIn: boolean } | null>(null);
  const lastScanned = useRef<string>("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;

    async function doCheckin(token: string) {
      setStatus("scanning");
      setMessage("正在签到...");
      try {
        const res = await fetch("/api/admin/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, method: "SCAN" }),
        });
        const data = await res.json();
        if (data.ok) {
          setStatus("success");
          setResult(data.registration);
          setMessage(data.first ? "签到成功" : "已签到过");
          setTimeout(() => {
            setStatus("scanning");
            setMessage("请继续扫码");
            setResult(null);
          }, 2000);
        } else {
          setStatus("error");
          setMessage(data.error || "签到失败");
          setTimeout(() => {
            setStatus("scanning");
            setMessage("请继续扫码");
          }, 2000);
        }
      } catch {
        setStatus("error");
        setMessage("网络错误");
      }
      setTimeout(() => {
        lastScanned.current = "";
      }, 2500);
    }

    function tick() {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
        raf = requestAnimationFrame(tick);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });
      if (code?.data) {
        const token = extractToken(code.data);
        if (token && token !== lastScanned.current) {
          lastScanned.current = token;
          void doCheckin(token);
        }
      }
      raf = requestAnimationFrame(tick);
    }

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStatus("scanning");
          setMessage("请将二维码对准摄像头");
          tick();
        }
      } catch {
        setStatus("error");
        setMessage("无法访问摄像头，请检查权限");
      }
    }

    void start();
    return () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">扫码签到</h1>
      <div className="relative aspect-[4/3] w-full max-w-xl overflow-hidden rounded-xl bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />
        <div
          className={`absolute inset-x-0 bottom-0 p-3 text-center text-sm text-white ${
            status === "success" ? "bg-emerald-600" : status === "error" ? "bg-red-600" : "bg-black/50"
          }`}
        >
          {message}
        </div>
      </div>
      {result && (
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="text-lg font-semibold text-emerald-600">{result.fullName}</div>
          <div className="text-sm text-gray-500">{result.type}</div>
          <div className="text-xs text-gray-400">{result.checkedIn ? "此前已签到" : "首次签到"}</div>
        </div>
      )}
    </div>
  );
}

function extractToken(text: string): string | null {
  const m = text.match(/\/c\/([a-f0-9]+)/i);
  if (m) return m[1];
  try {
    const url = new URL(text, "http://localhost");
    const token = url.searchParams.get("token");
    if (token) return token;
  } catch {
    // ignore
  }
  const clean = text.trim();
  if (/^[a-f0-9]{32}$/i.test(clean)) return clean;
  return null;
}
