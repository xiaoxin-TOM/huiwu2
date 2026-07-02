"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheckIcon, AlertCircleIcon } from "@/components/icons";

interface CheckinState {
  status: "loading" | "success" | "error";
  message: string;
  info?: { fullName: string; type?: string };
}

function CheckinContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<CheckinState>(() =>
    token
      ? { status: "loading", message: "正在签到..." }
      : { status: "error", message: "缺少签到凭证" },
  );

  useEffect(() => {
    if (!token) return;
    fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setState({
            status: "success",
            message: data.first ? "签到成功，欢迎参会！" : "您已经签到过了",
            info: data.registration,
          });
        } else {
          setState({ status: "error", message: data.error || "签到失败" });
        }
      })
      .catch(() => {
        setState({ status: "error", message: "网络错误，请重试" });
      });
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm">
        {state.status === "loading" && <div className="mb-4 text-sky-600">{state.message}</div>}
        {state.status === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <ShieldCheckIcon className="h-8 w-8" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-emerald-700">{state.message}</h1>
            {state.info && (
              <div className="space-y-1 text-gray-600">
                <p className="text-lg font-semibold">{state.info.fullName}</p>
                <p className="text-sm">{state.info.type}</p>
              </div>
            )}
          </>
        )}
        {state.status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertCircleIcon className="h-8 w-8" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-red-700">签到失败</h1>
            <p className="text-gray-600">{state.message}</p>
          </>
        )}
        <Link href="/" className="mt-6 inline-block text-sm text-sky-600 hover:underline">
          返回首页
        </Link>
      </div>
    </div>
  );
}

export default function CheckinPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">加载中...</div>}>
      <CheckinContent />
    </Suspense>
  );
}
