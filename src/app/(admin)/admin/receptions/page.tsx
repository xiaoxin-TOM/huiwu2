import { requireCurrentMeeting } from "@/lib/meetings";
import { listGuests } from "@/lib/guests-admin";
import ReceptionExportButton from "@/components/ReceptionExportButton";
import QuickRoomEdit from "@/components/QuickRoomEdit";
import { ButtonLink } from "@/components/ui/Button";

const LEVEL_LABEL: Record<string, string> = {
  VIP: "VIP",
  NORMAL: "嘉宾",
  MEDIA: "媒体",
};

export default async function AdminReceptionsPage() {
  const meeting = await requireCurrentMeeting();
  const guests = await listGuests(meeting.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">接待管理</h1>
        <ReceptionExportButton guests={guests.map((g) => ({ ...g, reception: g.reception }))} />
      </div>
      {guests.length === 0 ? (
        <p className="text-gray-500">
          暂无嘉宾接待信息。请先在{" "}
          <ButtonLink href="/admin/guests" variant="ghost" size="xs">
            嘉宾管理
          </ButtonLink>{" "}
          中添加嘉宾。
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="px-4 py-3">姓名</th>
                <th className="px-4 py-3">单位</th>
                <th className="px-4 py-3">级别</th>
                <th className="px-4 py-3">抵达</th>
                <th className="px-4 py-3">返程</th>
                <th className="px-4 py-3">酒店</th>
                <th className="px-4 py-3">房间号</th>
                <th className="px-4 py-3">司机/车牌</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => (
                <tr key={g.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{g.name}</td>
                  <td className="px-4 py-3 text-gray-500">{g.company || "-"}</td>
                  <td className="px-4 py-3">{LEVEL_LABEL[g.level] ?? g.level}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {[g.reception?.arriveMode, g.reception?.arriveNo, g.reception?.arriveTime].filter(Boolean).join(" ") || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {[g.reception?.departMode, g.reception?.departNo, g.reception?.departTime].filter(Boolean).join(" ") || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{g.reception?.hotelName || "-"}</td>
                  <td className="px-4 py-3">
                    {g.reception ? (
                      <QuickRoomEdit receptionId={g.reception.id} defaultValue={g.reception.hotelRoom} />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {[g.reception?.carDriver, g.reception?.carPlate].filter(Boolean).join(" / ") || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <ButtonLink href={`/admin/guests/${g.id}/edit`} variant="secondary" size="xs">
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
