"use client";

import { toCsv } from "@/lib/csv";
import type { ReceptionRow } from "@/types/reception";

const KIND_LABEL: Record<string, string> = {
  guest: "嘉宾",
  registration: "报名人员",
};

export default function ReceptionExportButton({ rows }: { rows: ReceptionRow[] }) {
  function exportCsv() {
    const headers = [
      "来源", "姓名", "单位", "分类", "手机", "邮箱",
      "抵达方式", "抵达班次", "抵达时间", "抵达地点",
      "返程方式", "返程班次", "返程时间",
      "酒店", "房间号", "入住", "退房",
      "车牌", "司机", "司机电话", "接待联系人", "备注",
    ];
    const csvRows = rows.map((r) => [
      KIND_LABEL[r.kind] ?? r.kind,
      r.name,
      r.company,
      r.category,
      r.phone ?? "",
      r.email ?? "",
      r.reception?.arriveMode ?? "",
      r.reception?.arriveNo ?? "",
      r.reception?.arriveTime ?? "",
      r.reception?.arrivePlace ?? "",
      r.reception?.departMode ?? "",
      r.reception?.departNo ?? "",
      r.reception?.departTime ?? "",
      r.reception?.hotelName ?? "",
      r.reception?.hotelRoom ?? "",
      r.reception?.hotelCheckIn ?? "",
      r.reception?.hotelCheckOut ?? "",
      r.reception?.carPlate ?? "",
      r.reception?.carDriver ?? "",
      r.reception?.carDriverPhone ?? "",
      r.reception?.carContact ?? "",
      r.reception?.remark ?? "",
    ]);
    const csv = toCsv(headers, csvRows);
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receptions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button onClick={exportCsv} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">
      导出 CSV
    </button>
  );
}
