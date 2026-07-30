"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { MEAL_SLOTS, MEAL_SLOT_LABEL } from "@/lib/meals";

export type MealRow = {
  id: string;
  day: string;
  slot: string;
  name: string;
  venue: string;
  startTime: string;
  endTime: string;
  typeIds: string[];
  isVisible: boolean;
  redeemed: number;
};

export type TypeOption = { id: string; name: string };

const EMPTY = {
  day: "",
  slot: "LUNCH" as string,
  name: "",
  venue: "",
  startTime: "",
  endTime: "",
  typeIds: [] as string[],
  isVisible: true,
};

export default function MealSessionEditor({
  meals,
  types,
}: {
  meals: MealRow[];
  types: TypeOption[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ ...EMPTY });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function startCreate() {
    setEditingId("new");
    setDraft({ ...EMPTY });
    setError("");
  }

  function startEdit(m: MealRow) {
    setEditingId(m.id);
    setDraft({
      day: m.day,
      slot: m.slot,
      name: m.name,
      venue: m.venue,
      startTime: m.startTime,
      endTime: m.endTime,
      typeIds: m.typeIds,
      isVisible: m.isVisible,
    });
    setError("");
  }

  async function submit() {
    if (!draft.day) {
      setError("请选择日期");
      return;
    }
    setBusy(true);
    setError("");
    const url = editingId === "new" ? "/api/admin/meals" : `/api/admin/meals/${editingId}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || "保存失败");
        return;
      }
      setEditingId(null);
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setBusy(false);
    }
  }

  async function remove(m: MealRow) {
    setBusy(true);
    try {
      await fetch(`/api/admin/meals/${m.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function toggleType(id: string) {
    setDraft((d) => ({
      ...d,
      typeIds: d.typeIds.includes(id) ? d.typeIds.filter((t) => t !== id) : [...d.typeIds, id],
    }));
  }

  return (
    <div className="space-y-4">
      {editingId === null && (
        <Button variant="primary" size="sm" onClick={startCreate}>
          新增餐次
        </Button>
      )}

      {editingId !== null && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <h3 className="font-medium text-slate-800">{editingId === "new" ? "新增餐次" : "编辑餐次"}</h3>
          {error && <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-sm text-gray-600">日期</label>
              <input
                type="date"
                value={draft.day}
                onChange={(e) => setDraft({ ...draft, day: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">餐次</label>
              <select
                value={draft.slot}
                onChange={(e) => setDraft({ ...draft, slot: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              >
                {MEAL_SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {MEAL_SLOT_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600">名称（可选）</label>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="如：欢迎晚宴"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">地点</label>
              <input
                value={draft.venue}
                onChange={(e) => setDraft({ ...draft, venue: e.target.value })}
                placeholder="如：三楼宴会厅"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">开始时间</label>
              <input
                type="time"
                value={draft.startTime}
                onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">结束时间</label>
              <input
                type="time"
                value={draft.endTime}
                onChange={(e) => setDraft({ ...draft, endTime: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600">适用参会类型</label>
            <p className="text-xs text-gray-400">全不勾选 = 所有人可用（新增参会类型时不必回来补配置）</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {types.length === 0 ? (
                <span className="text-xs text-gray-400">暂无参会类型</span>
              ) : (
                types.map((t) => (
                  <label key={t.id} className="flex items-center gap-1 rounded border px-2 py-1 text-xs">
                    <input
                      type="checkbox"
                      checked={draft.typeIds.includes(t.id)}
                      onChange={() => toggleType(t.id)}
                    />
                    {t.name}
                  </label>
                ))
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={draft.isVisible}
              onChange={(e) => setDraft({ ...draft, isVisible: e.target.checked })}
            />
            对参会用户可见
          </label>

          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={() => void submit()} disabled={busy}>
              {busy ? "保存中…" : "保存"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setEditingId(null)} disabled={busy}>
              取消
            </Button>
          </div>
        </div>
      )}

      {meals.length === 0 ? (
        <p className="text-gray-500">暂无餐次，点击「新增餐次」开始安排。</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="px-4 py-3">日期</th>
                <th className="px-4 py-3">餐次</th>
                <th className="px-4 py-3">名称</th>
                <th className="px-4 py-3">地点 / 时间</th>
                <th className="px-4 py-3">适用类型</th>
                <th className="px-4 py-3">已核销</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {meals.map((m) => (
                <tr key={m.id} className="border-b">
                  <td className="px-4 py-3">{m.day}</td>
                  <td className="px-4 py-3">{MEAL_SLOT_LABEL[m.slot] ?? m.slot}</td>
                  <td className="px-4 py-3">
                    {m.name || "-"}
                    {!m.isVisible && (
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">已隐藏</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {[m.venue, [m.startTime, m.endTime].filter(Boolean).join("-")].filter(Boolean).join(" · ") || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {m.typeIds.length === 0
                      ? "全部"
                      : types
                          .filter((t) => m.typeIds.includes(t.id))
                          .map((t) => t.name)
                          .join("、") || "已删除的类型"}
                  </td>
                  <td className="px-4 py-3 font-medium text-sky-700">{m.redeemed}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="xs" onClick={() => startEdit(m)}>
                        编辑
                      </Button>
                      <Button variant="danger" size="xs" disabled={busy} onClick={() => void remove(m)}>
                        删除
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
