"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import ImageUploadField from "@/components/ImageUploadField";
import { groupTablesByArea, tableOccupancy } from "@/lib/seating";
import type { SeatTableView } from "@/lib/seating-admin";

export type UnseatedPerson = { kind: "guest" | "registration"; id: string; name: string; org: string };

export default function SeatingEditor({
  tables,
  unseated,
  seatMapUrl,
  seatMapNote,
}: {
  tables: SeatTableView[];
  unseated: UnseatedPerson[];
  seatMapUrl: string;
  seatMapNote: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [newTable, setNewTable] = useState({ name: "", capacity: 10, area: "" });
  const [selected, setSelected] = useState<UnseatedPerson | null>(null);
  const [search, setSearch] = useState("");

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/seating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || "操作失败");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("网络错误");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function addTable() {
    if (!newTable.name.trim()) {
      setError("请填写桌号");
      return;
    }
    if (await post({ action: "create-table", ...newTable })) {
      setNewTable({ name: "", capacity: 10, area: "" });
    }
  }

  async function assignTo(tableId: string) {
    if (!selected) return;
    const body: Record<string, unknown> = { action: "assign", seatTableId: tableId };
    if (selected.kind === "guest") body.guestId = selected.id;
    else body.registrationId = selected.id;
    if (await post(body)) setSelected(null);
  }

  const groups = groupTablesByArea(tables);
  const filtered = unseated.filter(
    (p) => !search.trim() || p.name.includes(search.trim()) || p.org.includes(search.trim()),
  );

  return (
    <div className="space-y-6">
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-medium text-slate-800">会场平面图</h2>
        <p className="text-xs text-slate-500">上传后参会用户查座时可看图定位。</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <ImageUploadField name="seatMapUrl" label="平面图" defaultValue={seatMapUrl} />
          <div>
            <label className="block text-sm text-gray-600">说明文字</label>
            <input
              id="seat-map-note"
              defaultValue={seatMapNote}
              placeholder="如：舞台在图上方"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => {
            const url = (document.querySelector('input[name="seatMapUrl"]') as HTMLInputElement | null)?.value ?? "";
            const note = (document.getElementById("seat-map-note") as HTMLInputElement | null)?.value ?? "";
            void post({ action: "seat-map", seatMapUrl: url, seatMapNote: note });
          }}
        >
          保存平面图
        </Button>
      </section>

      <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-medium text-slate-800">新增桌位</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <input
            value={newTable.name}
            onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
            placeholder="桌号，如 1 号桌"
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            type="number"
            min={1}
            value={newTable.capacity}
            onChange={(e) => setNewTable({ ...newTable, capacity: Number(e.target.value) })}
            placeholder="容量"
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            value={newTable.area}
            onChange={(e) => setNewTable({ ...newTable, area: e.target.value })}
            placeholder="分区（可选）"
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <Button variant="primary" size="sm" disabled={busy} onClick={() => void addTable()}>
            添加
          </Button>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          {groups.length === 0 ? (
            <p className="text-gray-500">还没有桌位，先在上方添加。</p>
          ) : (
            groups.map((g) => (
              <div key={g.area || "no-area"} className="space-y-2">
                <h3 className="text-sm font-medium text-slate-500">{g.area || "未分区"}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {g.tables.map((t) => {
                    const occ = tableOccupancy(t);
                    return (
                      <div key={t.id} className="rounded-xl bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-slate-800">{t.name}</span>
                          <span
                            className={`text-xs ${occ.isFull ? "text-amber-700" : "text-slate-500"}`}
                          >
                            {occ.seated}/{occ.capacity}
                            {occ.isFull ? " 已满" : ` · 余 ${occ.remaining}`}
                          </span>
                        </div>

                        <div className="mt-2 space-y-1">
                          {t.assignments.length === 0 ? (
                            <p className="text-xs text-slate-400">暂无排座</p>
                          ) : (
                            t.assignments.map((a) => (
                              <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                                <span className="truncate text-slate-700">
                                  {a.seatNo ? `${a.seatNo}. ` : ""}
                                  {a.name}
                                  {a.org && <span className="ml-1 text-xs text-slate-400">{a.org}</span>}
                                </span>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => void post({ action: "unassign", id: a.id })}
                                  className="shrink-0 text-xs text-red-500 hover:underline disabled:text-slate-300"
                                >
                                  移除
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {selected && (
                            <Button variant="primary" size="xs" disabled={busy} onClick={() => void assignTo(t.id)}>
                              把「{selected.name}」排到此桌
                            </Button>
                          )}
                          <Button
                            variant="danger"
                            size="xs"
                            disabled={busy}
                            onClick={() =>
                              void fetch(`/api/admin/seating/${t.id}`, { method: "DELETE" }).then(() =>
                                router.refresh(),
                              )
                            }
                          >
                            删除桌位
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>

        <aside className="space-y-3 rounded-xl bg-white p-4 shadow-sm lg:sticky lg:top-6 lg:self-start">
          <h2 className="font-medium text-slate-800">未排座人员 {unseated.length}</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索姓名或单位"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          {selected && (
            <div className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800">
              已选「{selected.name}」，点右侧桌位卡片上的按钮完成排座
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="ml-2 text-xs text-sky-600 hover:underline"
              >
                取消
              </button>
            </div>
          )}
          <div className="max-h-[50vh] space-y-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-400">
                {unseated.length === 0 ? "所有人都已排座" : "没有匹配的人员"}
              </p>
            ) : (
              filtered.map((p) => (
                <button
                  key={`${p.kind}-${p.id}`}
                  type="button"
                  onClick={() => setSelected(p)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    selected?.id === p.id ? "bg-sky-100" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="mr-1 rounded bg-slate-100 px-1 text-xs text-slate-500">
                    {p.kind === "guest" ? "嘉宾" : "报名"}
                  </span>
                  {p.name}
                  {p.org && <span className="ml-1 text-xs text-slate-400">{p.org}</span>}
                </button>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
