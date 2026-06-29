"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
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
          phone: fd.get("phone"),
          organization: fd.get("organization"),
        }),
      });
      const data = await res.json();
      if (!data.ok) setError(data.error);
      else router.push("/login");
    } catch {
      setError("网络错误,请稍后重试");
    }
  }
  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="mb-6 text-2xl font-bold">注册</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input name="name" placeholder="姓名" required className="w-full rounded border px-3 py-2" />
        <input name="email" type="email" placeholder="邮箱" required className="w-full rounded border px-3 py-2" />
        <input name="password" type="password" placeholder="密码(至少6位)" required className="w-full rounded border px-3 py-2" />
        <input name="phone" placeholder="手机号(选填)" className="w-full rounded border px-3 py-2" />
        <input name="organization" placeholder="单位(选填)" className="w-full rounded border px-3 py-2" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full rounded bg-sky-700 py-2 text-white">注册</button>
      </form>
      <p className="mt-4 text-sm">已有账号?<Link href="/login" className="text-sky-700">去登录</Link></p>
    </div>
  );
}
