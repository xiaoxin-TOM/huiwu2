"use client";

import { useMemo, useState } from "react";
import QuickRoomEdit from "@/components/QuickRoomEdit";
import ReceptionBulkDialog from "@/components/ReceptionBulkDialog";
import { Button, ButtonLink } from "@/components/ui/Button";
import type { ReceptionRow, ReceptionTarget } from "@/types/reception";

const KIND_LABEL: Record<string, string> = {
  guest: "嘉宾",
  registration: "报名",
};

function rowKey(row: ReceptionRow): string {
  return `${row.kind}-${row.id}`;
}

export default function ReceptionTable({ rows }: { rows: ReceptionRow[] }) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);

  // 只认当前筛选结果里的行，避免筛选变化后残留看不见的选中项
  const visibleSelected = useMemo(
    () => rows.filter((r) => selectedKeys.has(rowKey(r))),
    [rows, selectedKeys],
  );
  const targets: ReceptionTarget[] = visibleSelected.map((r) => ({ kind: r.kind, id: r.id }));
  const allSelected = rows.length > 0 && visibleSelected.length === rows.length;

  function toggleRow(row: ReceptionRow) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      const key = rowKey(row);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    setSelectedKeys(allSelected ? new Set() : new Set(rows.map(rowKey)));
  }

  return (
    <>
      {visibleSelected.length > 0 && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm shadow-sm">
          <span className="text-sky-800">
            已选 <span className="font-bold">{visibleSelected.length}</span> 人
          </span>
          <Button variant="primary" size="sm" onClick={() => setDialogOpen(true)}>
            批量设置接待信息
          </Button>
          <Button variant="ghost" onClick={() => setSelectedKeys(new Set())}>
            清除选择
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="全选当前筛选结果"
                />
              </th>
              <th className="px-4 py-3">来源</th>
              <th className="px-4 py-3">姓名</th>
              <th className="px-4 py-3">单位</th>
              <th className="px-4 py-3">分类</th>
              <th className="px-4 py-3">联系方式</th>
              <th className="px-4 py-3">抵达</th>
              <th className="px-4 py-3">返程</th>
              <th className="px-4 py-3">酒店</th>
              <th className="px-4 py-3">房间号</th>
              <th className="px-4 py-3">司机/车牌</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const key = rowKey(r);
              const checked = selectedKeys.has(key);
              return (
                <tr key={key} className={`border-b ${checked ? "bg-sky-50/60" : ""}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRow(r)}
                      aria-label={`选择 ${r.name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {KIND_LABEL[r.kind]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-gray-500">{r.company || "-"}</td>
                  <td className="px-4 py-3">{r.category}</td>
                  <td className="px-4 py-3 text-gray-500">{r.contact}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {[r.reception?.arriveMode, r.reception?.arriveNo, r.reception?.arriveTime]
                      .filter(Boolean)
                      .join(" ") || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {[r.reception?.departMode, r.reception?.departNo, r.reception?.departTime]
                      .filter(Boolean)
                      .join(" ") || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.reception?.hotelName || "-"}</td>
                  <td className="px-4 py-3">
                    {r.reception ? (
                      <QuickRoomEdit receptionId={r.reception.id} defaultValue={r.reception.hotelRoom} />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {[r.reception?.carDriver, r.reception?.carPlate].filter(Boolean).join(" / ") || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <ButtonLink
                      href={
                        r.kind === "guest"
                          ? `/admin/guests/${r.id}/edit`
                          : `/admin/registrations/${r.id}/reception`
                      }
                      variant="secondary"
                      size="xs"
                    >
                      编辑
                    </ButtonLink>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {dialogOpen && (
        <ReceptionBulkDialog
          targets={targets}
          onClose={() => setDialogOpen(false)}
          onApplied={() => setSelectedKeys(new Set())}
        />
      )}
    </>
  );
}
