"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/ui/AuthCard";
import { inputClass, buttonClass, labelClass } from "@/components/ui/Card";
import { UserIcon, MailIcon, LockIcon, BuildingIcon, PhoneIcon, ShieldCheckIcon } from "@/components/icons";

function getSafeCallbackUrl(raw: string | null): string | undefined {
  if (!raw) return undefined;
  try {
    const url = new URL(raw, "http://localhost");
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    const path = url.pathname + url.search;
    if (!path.startsWith("/")) return undefined;
    return path;
  } catch {
    return undefined;
  }
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [email, setEmail] = useState("");

  async function sendCode() {
    if (!email) {
      setError("请先填写邮箱");
      return;
    }
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "验证码发送失败");
        return;
      }
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setSending(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          password: fd.get("password"),
          code: fd.get("code"),
          phone: fd.get("phone"),
          organization: fd.get("organization"),
        }),
      });
      const data = await res.json();
      if (!data.ok) setError(data.error);
      else router.push(callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login");
    } catch {
      setError("网络错误，请稍后重试");
    }
  }

  return (
    <div className="py-8">
      <AuthCard title="注册账号" subtitle="填写信息完成会议报名注册">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5">
                <UserIcon className="h-4 w-4 text-slate-400" />
                姓名
              </span>
            </label>
            <input name="name" placeholder="请输入姓名" required className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5">
                <MailIcon className="h-4 w-4 text-slate-400" />
                邮箱
              </span>
            </label>
            <input
              name="email"
              type="email"
              placeholder="请输入邮箱"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5">
                <ShieldCheckIcon className="h-4 w-4 text-slate-400" />
                验证码
              </span>
            </label>
            <div className="flex gap-2">
              <input
                name="code"
                placeholder="6位验证码"
                maxLength={6}
                required
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={sendCode}
                disabled={sending || countdown > 0}
                className="whitespace-nowrap rounded-lg bg-sky-100 px-3 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-200 disabled:opacity-50"
              >
                {countdown > 0 ? `${countdown}s 后重发` : sending ? "发送中…" : "获取验证码"}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">验证码有效期 3 分钟</p>
          </div>

          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5">
                <LockIcon className="h-4 w-4 text-slate-400" />
                密码
              </span>
            </label>
            <input
              name="password"
              type="password"
              placeholder="密码（至少6位）"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5">
                <PhoneIcon className="h-4 w-4 text-slate-400" />
                联系方式（选填）
              </span>
            </label>
            <input name="phone" placeholder="请输入联系方式" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5">
                <BuildingIcon className="h-4 w-4 text-slate-400" />
                单位（选填）
              </span>
            </label>
            <input name="organization" placeholder="请输入单位" className={inputClass} />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button type="submit" className={buttonClass}>
            注册
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">
          已有账号？
          <Link
            href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"}
            className="font-medium text-sky-600 hover:underline"
          >
            去登录
          </Link>
        </p>
      </AuthCard>
    </div>
  );
}
