"use client";

import { useState } from "react";

interface RegistrationItem {
  id: string;
  fullName: string;
  organization: string;
  phone: string;
  email?: string;
  type?: string;
  status: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  token: string;
}

export default function ManualCheckinPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<RegistrationItem[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function search() {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/checkin/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setList(data.ok ? data.list : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  async function checkin(item: RegistrationItem) {
    setToast(null);
    try {
      const res = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: item.id, method: "MANUAL" }),
      });
      const data = await res.json();
      if (data.ok) {
        setToast({ type: "success", message: `${data.registration.fullName} ${data.first ? "签到成功" : "已签到过"}` });
        setList((prev) =>
          prev.map((r) =>
            r.id === item.id
              ? { ...r, checkedIn: true, checkedInAt: new Date().toISOString() }
              : r,
          ),
        );
      } else {
        setToast({ type: "error", message: data.error || "签到失败" });
      }
    } catch {
      setToast({ type: "error", message: "网络错误" });
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">手动签到</h1>

      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="搜索姓名、手机、邮箱或单位"
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
        <button
          onClick={search}
          disabled={loading}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-50"
        >
          {loading ? "搜索中..." : "搜索"}
        </button>
      </div>

      {toast && (
        <div
          className={`rounded-lg px-4 py-2 text-sm ${
            toast.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      )}

      {list.length === 0 && !loading && q && <p className="text-sm text-gray-500">未找到匹配记录。</p>}

      {list.length > 0 && (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="px-4 py-3">姓名</th>
                <th className="px-4 py-3">单位</th>
                <th className="px-4 py-3">手机</th>
                <th className="px-4 py-3">类型</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{item.fullName}</td>
                  <td className="px-4 py-3 text-gray-500">{item.organization}</td>
                  <td className="px-4 py-3 text-gray-500">{item.phone}</td>
                  <td className="px-4 py-3 text-gray-500">{item.type}</td>
                  <td className="px-4 py-3">
                    {item.checkedIn ? (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">已签到</span>
                    ) : (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">未签到</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => checkin(item)}
                      disabled={item.checkedIn}
                      className="rounded bg-sky-600 px-3 py-1 text-xs text-white transition hover:bg-sky-700 disabled:bg-gray-300"
                    >
                      {item.checkedIn ? "已签到" : "签到"}
                    </button>
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
