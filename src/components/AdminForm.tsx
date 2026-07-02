"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AdminFormProps {
  action: string;
  redirectTo: string;
  children: React.ReactNode;
  className?: string;
}

export default function AdminForm({ action, redirectTo, children, className }: AdminFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch(action, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        router.push(redirectTo);
        router.refresh();
        return;
      }

      let msg = "操作失败";
      try {
        const data = await res.json();
        if (data.error) msg = data.error;
      } catch {
        // ignore parse error
      }
      setError(msg);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`${className ?? ""} ${loading ? "pointer-events-none opacity-50" : ""}`}
    >
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}
      {children}
    </form>
  );
}
