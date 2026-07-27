"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export type ReportLinkRow = {
  id: string;
  token: string;
  name: string;
  isActive: boolean;
  expiresAt: string | null;
  state: "OK" | "INACTIVE" | "EXPIRED";
};

const STATE_LABEL: Record<ReportLinkRow["state"], string> = {
  OK: "生效中",
  INACTIVE: "已停用",
  EXPIRED: "已过期",
};

export default function ReportLinkManager({ links }: { links: ReportLinkRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError("");
    const form = new FormData();
    form.append("name", name);
    form.append("password", password);
    form.append("expiresAt", expiresAt);
    try {
      const res = await fetch("/api/admin/report-links", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || "生成失败");
        return;
      }
      setOpen(false);
      setName("");
      setPassword("");
      setExpiresAt("");
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(id: string, isActive: boolean) {
    const form = new FormData();
    form.append("action", isActive ? "deactivate" : "activate");
    await fetch(`/api/admin/report-links/${id}`, { method: "POST", body: form });
    router.refresh();
  }

  async function copy(token: string) {
    const url = `${window.location.origin}/p/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError(`复制失败，请手动记录：${url}`);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" size="sm" onClick={() => setOpen((v) => !v)}>
          生成汇报链接
        </Button>
        <p className="text-xs text-gray-500">
          链接可查看本会议全部已通过审核的材料（含保密），请仅发给现场主控人员。
        </p>
      </div>

      {open && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-sm text-gray-600">链接名称</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如：主会场大屏"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">
                访问密码 <span className="text-red-500">*</span>
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 6 位"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">失效时间（可选）</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            密码不可省略：该链接无需登录即可打开保密材料，等同于一份管理员级凭证。建议设置失效时间，会议结束后及时停用。
          </p>
          <Button variant="primary" size="sm" disabled={busy} onClick={() => void create()}>
            {busy ? "生成中…" : "确认生成"}
          </Button>
        </div>
      )}

      {links.length > 0 && (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="px-4 py-2">名称</th>
                <th className="px-4 py-2">链接</th>
                <th className="px-4 py-2">状态</th>
                <th className="px-4 py-2">失效时间</th>
                <th className="px-4 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr key={l.id} className="border-b">
                  <td className="px-4 py-2">{l.name || "未命名"}</td>
                  <td className="px-4 py-2">
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">/p/{l.token.slice(0, 8)}…</code>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        l.state === "OK" ? "text-emerald-700" : l.state === "EXPIRED" ? "text-amber-700" : "text-gray-400"
                      }
                    >
                      {STATE_LABEL[l.state]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500">{l.expiresAt ?? "不限"}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="xs" onClick={() => void copy(l.token)}>
                        {copied === l.token ? "已复制" : "复制链接"}
                      </Button>
                      <Button variant="secondary" size="xs" onClick={() => void toggle(l.id, l.isActive)}>
                        {l.isActive ? "停用" : "启用"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
