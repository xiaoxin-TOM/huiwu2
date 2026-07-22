"use client";

import { useEffect, useState } from "react";
import { STATUS_LABEL } from "@/lib/labels";

type RegistrationRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  typeId: string;
  typeName: string;
  organization: string;
  status: string;
  checkedIn: boolean;
};

type TypeOption = { id: string; name: string };
type Bucket = "UNREGISTERED" | "REGISTERED";

const TABS: { key: Bucket; label: string }[] = [
  { key: "UNREGISTERED", label: "未报名（待审核）" },
  { key: "REGISTERED", label: "已报名（已通过）" },
];

export default function RegistrationsTable({ types }: { types: TypeOption[] }) {
  const [bucket, setBucket] = useState<Bucket>("UNREGISTERED");
  const [items, setItems] = useState<RegistrationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [typeId, setTypeId] = useState("");
  const [organization, setOrganization] = useState("");
  const [organizationInput, setOrganizationInput] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function load() {
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams({ page: String(page), bucket });
      if (typeId) params.set("typeId", typeId);
      if (organization) params.set("organization", organization);
      const res = await fetch(`/api/admin/registrations/list?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "获取报名列表失败");
      setItems(data.items);
      setTotal(data.total);
      setPageSize(data.pageSize);
      setSelected(new Set());
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "获取报名列表失败" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeId, organization, bucket]);

  function toggleSelect(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((current) => (current.size === items.length ? new Set() : new Set(items.map((i) => i.id))));
  }

  async function review(ids: string[], decision: "APPROVED" | "REJECTED") {
    if (ids.length === 0) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/registrations/batch-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, decision }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "操作失败");
      setMessage({ type: "success", text: `已${decision === "APPROVED" ? "通过" : "拒绝"} ${data.count} 条报名` });
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "操作失败" });
      setLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const showReviewActions = bucket === "UNREGISTERED";

  return (
    <div className="space-y-3">
      <div className="flex gap-2 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              if (bucket === t.key) return;
              setBucket(t.key);
              setPage(1);
            }}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
              bucket === t.key
                ? "border-sky-600 text-sky-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm text-gray-600">
          按类型筛选
          <select
            value={typeId}
            onChange={(e) => {
              setPage(1);
              setTypeId(e.target.value);
            }}
            className="mt-1 block rounded-lg border px-3 py-2"
          >
            <option value="">全部类型</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-gray-600">
          按单位筛选
          <div className="mt-1 flex gap-2">
            <input
              value={organizationInput}
              onChange={(e) => setOrganizationInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  setOrganization(organizationInput);
                }
              }}
              placeholder="输入单位关键字"
              className="rounded-lg border px-3 py-2"
            />
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setOrganization(organizationInput);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
            >
              筛选
            </button>
          </div>
        </label>
        {showReviewActions && (
          <button
            type="button"
            disabled={selected.size === 0 || loading}
            onClick={() => void review([...selected], "APPROVED")}
            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            批量通过（已选 {selected.size} 条）
          </button>
        )}
      </div>

      {message && (
        <div className={`rounded-lg px-3 py-2 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {message.text}
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-gray-500">{loading ? "加载中..." : "暂无报名。"}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                {showReviewActions && (
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.size === items.length && items.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="px-4 py-3">姓名</th>
                <th className="px-4 py-3">邮箱</th>
                <th className="px-4 py-3">联系电话</th>
                <th className="px-4 py-3">类型</th>
                <th className="px-4 py-3">单位</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">签到</th>
                {showReviewActions && <th className="px-4 py-3">操作</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b">
                  {showReviewActions && (
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} />
                    </td>
                  )}
                  <td className="px-4 py-3">{r.fullName}</td>
                  <td className="px-4 py-3">{r.email}</td>
                  <td className="px-4 py-3">{r.phone || "-"}</td>
                  <td className="px-4 py-3">{r.typeName}</td>
                  <td className="px-4 py-3">{r.organization}</td>
                  <td className="px-4 py-3 text-sky-700">{STATUS_LABEL[r.status] ?? r.status}</td>
                  <td className="px-4 py-3">
                    {r.checkedIn ? (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">已签到</span>
                    ) : (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">未签到</span>
                    )}
                  </td>
                  {showReviewActions && (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => void review([r.id], "APPROVED")}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                        >
                          通过
                        </button>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => void review([r.id], "REJECTED")}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                        >
                          拒绝
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>共 {total} 条，第 {page}/{totalPages} 页</span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 disabled:opacity-40"
          >
            上一页
          </button>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
