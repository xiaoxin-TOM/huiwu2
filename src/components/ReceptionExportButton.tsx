"use client";

import { toCsv } from "@/lib/csv";

type GuestWithReception = {
  id: string;
  name: string;
  company: string;
  level: string;
  phone: string | null;
  email: string | null;
  reception: {
    hotelName: string;
    hotelRoom: string;
    hotelCheckIn: string;
    hotelCheckOut: string;
    arriveMode: string;
    arriveNo: string;
    arriveTime: string;
    arrivePlace: string;
    departMode: string;
    departNo: string;
    departTime: string;
    carPlate: string;
    carDriver: string;
    carDriverPhone: string;
    carContact: string;
    remark: string;
  } | null;
};

const LEVEL_LABEL: Record<string, string> = {
  VIP: "VIP",
  NORMAL: "嘉宾",
  MEDIA: "媒体",
};

export default function ReceptionExportButton({ guests }: { guests: GuestWithReception[] }) {
  function exportCsv() {
    const headers = [
      "姓名", "单位", "级别", "手机", "邮箱",
      "抵达方式", "抵达班次", "抵达时间", "抵达地点",
      "返程方式", "返程班次", "返程时间",
      "酒店", "房间号", "入住", "退房",
      "车牌", "司机", "司机电话", "接待联系人", "备注",
    ];
    const rows = guests.map((g) => [
      g.name,
      g.company,
      LEVEL_LABEL[g.level] ?? g.level,
      g.phone ?? "",
      g.email ?? "",
      g.reception?.arriveMode ?? "",
      g.reception?.arriveNo ?? "",
      g.reception?.arriveTime ?? "",
      g.reception?.arrivePlace ?? "",
      g.reception?.departMode ?? "",
      g.reception?.departNo ?? "",
      g.reception?.departTime ?? "",
      g.reception?.hotelName ?? "",
      g.reception?.hotelRoom ?? "",
      g.reception?.hotelCheckIn ?? "",
      g.reception?.hotelCheckOut ?? "",
      g.reception?.carPlate ?? "",
      g.reception?.carDriver ?? "",
      g.reception?.carDriverPhone ?? "",
      g.reception?.carContact ?? "",
      g.reception?.remark ?? "",
    ]);
    const csv = toCsv(headers, rows);
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
