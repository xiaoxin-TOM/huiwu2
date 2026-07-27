"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

/** 汇报链接的密码闸口。验证通过后由服务端下发 httpOnly cookie，刷新即进入章程页。 */
export default function ReportLinkGate({ token, meetingTitle }: { token: string; meetingTitle: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData();
    form.append("password", password);
    try {
      const res = await fetch(`/api/report-links/${token}/auth`, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || "验证失败");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("网络错误");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-800">{meetingTitle}</h1>
          <p className="mt-1 text-sm text-slate-500">现场汇报入口，请输入访问密码</p>
        </div>

        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="访问密码"
          autoFocus
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />

        <Button type="submit" variant="primary" size="md" disabled={busy} className="w-full">
          {busy ? "验证中…" : "进入"}
        </Button>
      </form>
    </div>
  );
}
