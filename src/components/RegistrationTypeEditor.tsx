"use client";

import { useState } from "react";

type TypeItem = { id: string; name: string; fee: number; description: string };

export default function RegistrationTypeEditor({
  initialTypes,
  registrationCounts,
}: {
  initialTypes: TypeItem[];
  registrationCounts: Record<string, number>;
}) {
  const [types, setTypes] = useState<TypeItem[]>(initialTypes);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ index: number; targetTypeId: string } | null>(null);

  function showMessage(text: string, type: "success" | "error" = "success") {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  async function saveType(index: number) {
    const item = types[index];
    if (!item.name.trim()) {
      showMessage("类型名称不能为空", "error");
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.set("name", item.name.trim());
      form.set("fee", String(item.fee));
      form.set("description", item.description.trim());
      const url = item.id.startsWith("draft-")
        ? "/api/admin/registration-types"
        : `/api/admin/registration-types/${item.id}`;
      const res = await fetch(url, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "保存失败");
      showMessage("保存成功");
      if (item.id.startsWith("draft-") && data.type?.id) {
        setTypes((current) => current.map((t, i) => (i === index ? { ...t, id: data.type.id } : t)));
      }
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "保存失败", "error");
    } finally {
      setLoading(false);
    }
  }

  function startDelete(index: number) {
    const item = types[index];
    if (item.id.startsWith("draft-")) {
      setTypes((current) => current.filter((_, i) => i !== index));
      return;
    }
    const count = registrationCounts[item.id] ?? 0;
    if (count === 0) {
      if (!confirm(`确定删除参会类型「${item.name}」吗？`)) return;
      void doDelete(index);
      return;
    }
    const otherTypes = types.filter((_, i) => i !== index && !types[i].id.startsWith("draft-"));
    setPendingDelete({
      index,
      targetTypeId: otherTypes[0]?.id ?? "",
    });
  }

  async function doDelete(index: number, targetTypeId?: string) {
    const item = types[index];
    setLoading(true);
    setPendingDelete(null);
    try {
      const form = new FormData();
      if (targetTypeId) form.set("targetTypeId", targetTypeId);
      const res = await fetch(`/api/admin/registration-types/${item.id}/delete`, {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "删除失败");
      setTypes((current) => current.filter((_, i) => i !== index));
      showMessage(targetTypeId ? "已转移报名并删除类型" : "删除成功");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "删除失败", "error");
    } finally {
      setLoading(false);
    }
  }

  function addType() {
    setTypes((current) => [
      ...current,
      { id: `draft-${Date.now()}`, name: "", fee: 0, description: "" },
    ]);
  }

  function patchType(index: number, patch: Partial<TypeItem>) {
    setTypes((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className={`space-y-3 ${loading ? "pointer-events-none opacity-70" : ""}`}>
      {message && (
        <div className={`rounded-lg px-3 py-2 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {message.text}
        </div>
      )}
      <div className="space-y-2">
        {types.map((item, index) => (
          <div key={item.id} className="flex flex-col gap-2 rounded-lg border bg-white p-3">
            <div className="flex flex-wrap items-end gap-2">
              <label className="block text-sm text-slate-600">
                类型名称
                <input
                  value={item.name}
                  onChange={(e) => patchType(index, { name: e.target.value })}
                  placeholder="例如：普通代表"
                  className="mt-1 w-40 rounded-lg border px-3 py-2"
                />
              </label>
              <label className="block text-sm text-slate-600">
                身份编号
                <input
                  type="number"
                  min={0}
                  value={item.fee}
                  onChange={(e) => patchType(index, { fee: Number(e.target.value) })}
                  className="mt-1 w-28 rounded-lg border px-3 py-2"
                />
              </label>
              <label className="block text-sm text-slate-600">
                说明
                <input
                  value={item.description}
                  onChange={(e) => patchType(index, { description: e.target.value })}
                  placeholder="可选"
                  className="mt-1 w-48 rounded-lg border px-3 py-2"
                />
              </label>
              <div className="flex items-center gap-2 pb-0.5">
                <button
                  type="button"
                  onClick={() => void saveType(index)}
                  className="rounded-lg bg-sky-700 px-3 py-2 text-sm text-white hover:bg-sky-800"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => startDelete(index)}
                  className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100"
                >
                  删除
                </button>
              </div>
            </div>
            {pendingDelete?.index === index && (
              <div className="rounded-lg bg-amber-50 p-3 text-sm">
                <p className="mb-2 text-amber-800">
                  该类型已有 <strong>{registrationCounts[item.id] ?? 0}</strong> 条报名记录，请选择要批量转移到的目标类型：
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={pendingDelete.targetTypeId}
                    onChange={(e) => setPendingDelete({ ...pendingDelete, targetTypeId: e.target.value })}
                    className="rounded-lg border px-2 py-1"
                  >
                    {types
                      .filter((t, i) => i !== index && !t.id.startsWith("draft-"))
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void doDelete(index, pendingDelete.targetTypeId)}
                    disabled={!pendingDelete.targetTypeId}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    确认转移并删除
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(null)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addType}
        className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100"
      >
        + 添加参会类型
      </button>
    </div>
  );
}
