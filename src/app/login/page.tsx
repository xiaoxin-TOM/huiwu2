"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/ui/AuthCard";
import { inputClass, buttonClass, labelClass } from "@/components/ui/Card";
import { LockIcon, MailIcon } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: fd.get("email"),
      password: fd.get("password"),
      redirect: false,
    });
    if (res?.error) setError("邮箱或密码错误");
    else router.push("/");
  }

  return (
    <div className="py-8">
      <AuthCard title="欢迎回来" subtitle="登录后参与会议报名">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5">
                <MailIcon className="h-4 w-4 text-slate-400" />
                邮箱
              </span>
            </label>
            <input name="email" type="email" placeholder="请输入邮箱" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5">
                <LockIcon className="h-4 w-4 text-slate-400" />
                密码
              </span>
            </label>
            <input name="password" type="password" placeholder="请输入密码" required className={inputClass} />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button type="submit" className={buttonClass}>
            登录
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">
          还没有账号？
          <Link href="/register" className="font-medium text-sky-600 hover:underline">
            去注册
          </Link>
        </p>
      </AuthCard>
    </div>
  );
}
