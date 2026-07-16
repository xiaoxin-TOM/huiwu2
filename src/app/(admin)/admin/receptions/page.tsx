import { requireCurrentMeeting } from "@/lib/meetings";
import { listGuests } from "@/lib/guests-admin";
import { listRegistrationsWithReception } from "@/lib/registrations";
import { prisma } from "@/lib/prisma";
import ReceptionExportButton from "@/components/ReceptionExportButton";
import ReceptionFilterBar from "@/components/ReceptionFilterBar";
import QuickRoomEdit from "@/components/QuickRoomEdit";
import { ButtonLink } from "@/components/ui/Button";
import type { ReceptionRow } from "@/types/reception";

const LEVEL_LABEL: Record<string, string> = {
  VIP: "VIP",
  NORMAL: "嘉宾",
  MEDIA: "媒体",
};

const KIND_LABEL: Record<string, string> = {
  guest: "嘉宾",
  registration: "报名",
};

function buildRows(
  guests: Awaited<ReturnType<typeof listGuests>>,
  regs: Awaited<ReturnType<typeof listRegistrationsWithReception>>,
): ReceptionRow[] {
  const guestRows: ReceptionRow[] = guests.map((g) => ({
    id: g.id,
    kind: "guest",
    name: g.name,
    company: g.company,
    category: LEVEL_LABEL[g.level] ?? g.level,
    contact: [g.phone, g.email].filter(Boolean).join(" / ") || "-",
    phone: g.phone,
    email: g.email,
    reception: g.reception
      ? {
          id: g.reception.id,
          arriveMode: g.reception.arriveMode,
          arriveNo: g.reception.arriveNo,
          arriveTime: g.reception.arriveTime,
          arrivePlace: g.reception.arrivePlace,
          departMode: g.reception.departMode,
          departNo: g.reception.departNo,
          departTime: g.reception.departTime,
          hotelName: g.reception.hotelName,
          hotelRoom: g.reception.hotelRoom,
          hotelCheckIn: g.reception.hotelCheckIn,
          hotelCheckOut: g.reception.hotelCheckOut,
          carPlate: g.reception.carPlate,
          carDriver: g.reception.carDriver,
          carDriverPhone: g.reception.carDriverPhone,
          carContact: g.reception.carContact,
          remark: g.reception.remark,
        }
      : null,
  }));
  const regRows: ReceptionRow[] = regs.map((r) => ({
    id: r.id,
    kind: "registration",
    name: r.fullName,
    company: r.organization,
    category: r.type.name,
    contact: [r.phone, r.user.email].filter(Boolean).join(" / ") || "-",
    phone: r.phone,
    email: r.user.email,
    reception: r.reception
      ? {
          id: r.reception.id,
          arriveMode: r.reception.arriveMode,
          arriveNo: r.reception.arriveNo,
          arriveTime: r.reception.arriveTime,
          arrivePlace: r.reception.arrivePlace,
          departMode: r.reception.departMode,
          departNo: r.reception.departNo,
          departTime: r.reception.departTime,
          hotelName: r.reception.hotelName,
          hotelRoom: r.reception.hotelRoom,
          hotelCheckIn: r.reception.hotelCheckIn,
          hotelCheckOut: r.reception.hotelCheckOut,
          carPlate: r.reception.carPlate,
          carDriver: r.reception.carDriver,
          carDriverPhone: r.reception.carDriverPhone,
          carContact: r.reception.carContact,
          remark: r.reception.remark,
        }
      : null,
  }));
  return [...guestRows, ...regRows].sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

function filterRows(rows: ReceptionRow[], source: string, category: string, q: string) {
  return rows.filter((r) => {
    if (source !== "ALL" && r.kind !== source) return false;
    if (category !== "ALL") {
      if (category.startsWith("guest:")) {
        if (r.kind !== "guest") return false;
        const level = category.replace("guest:", "");
        if (LEVEL_LABEL[level] !== r.category && level !== r.category) return false;
      } else if (category.startsWith("type:")) {
        if (r.kind !== "registration") return false;
        const typeName = category.replace("type:", "");
        if (r.category !== typeName) return false;
      }
    }
    if (q.trim()) {
      const search = q.trim().toLowerCase();
      return (
        r.name.toLowerCase().includes(search) ||
        r.company.toLowerCase().includes(search) ||
        r.contact.toLowerCase().includes(search)
      );
    }
    return true;
  });
}

export default async function AdminReceptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; category?: string; q?: string }>;
}) {
  const meeting = await requireCurrentMeeting();
  const params = await searchParams;
  const source = params.source ?? "ALL";
  const category = params.category ?? "ALL";
  const q = params.q ?? "";

  const guests = await listGuests(meeting.id);
  const regs = await listRegistrationsWithReception(meeting.id);
  const types = await prisma.registrationType.findMany({ orderBy: { name: "asc" } });

  const allRows = buildRows(guests, regs);
  const rows = filterRows(allRows, source, category, q);

  const categories = [
    { value: "guest:VIP", label: "VIP", group: "嘉宾级别" },
    { value: "guest:NORMAL", label: "嘉宾", group: "嘉宾级别" },
    { value: "guest:MEDIA", label: "媒体", group: "嘉宾级别" },
    ...types.map((t) => ({ value: `type:${t.name}`, label: t.name, group: "报名类型" })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">接待管理</h1>
        <ReceptionExportButton rows={allRows} />
      </div>

      <ReceptionFilterBar categories={categories} />

      {rows.length === 0 ? (
        <p className="text-gray-500">
          暂无接待信息。请先在{" "}
          <ButtonLink href="/admin/guests" variant="ghost" size="xs">
            嘉宾管理
          </ButtonLink>{" "}
          或{" "}
          <ButtonLink href="/admin/registrations" variant="ghost" size="xs">
            报名管理
          </ButtonLink>{" "}
          中维护人员。
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
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
              {rows.map((r) => (
                <tr key={`${r.kind}-${r.id}`} className="border-b">
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
                    {[r.reception?.arriveMode, r.reception?.arriveNo, r.reception?.arriveTime].filter(Boolean).join(" ") || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {[r.reception?.departMode, r.reception?.departNo, r.reception?.departTime].filter(Boolean).join(" ") || "-"}
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
                      href={r.kind === "guest" ? `/admin/guests/${r.id}/edit` : `/admin/registrations/${r.id}/reception`}
                      variant="secondary"
                      size="xs"
                    >
                      编辑
                    </ButtonLink>
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
