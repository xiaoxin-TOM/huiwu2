"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    // TODO Phase 2: 个人中心 /me
    else router.push("/");
  }
  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="mb-6 text-2xl font-bold">登录</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input name="email" type="email" placeholder="邮箱" required className="w-full rounded border px-3 py-2" />
        <input name="password" type="password" placeholder="密码" required className="w-full rounded border px-3 py-2" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full rounded bg-sky-700 py-2 text-white">登录</button>
      </form>
      <p className="mt-4 text-sm">还没有账号?<Link href="/register" className="text-sky-700">去注册</Link></p>
    </div>
  );
}
