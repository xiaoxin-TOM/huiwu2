import { currentUser } from "@/lib/session";
import { requirePublicMeeting, guardPublicAccess } from "@/lib/public-guard";
import { meetingHref } from "@/lib/public";
import { getUserRegistration } from "@/lib/registrations";
import { listSeatTables, getSeatMap } from "@/lib/seating-admin";
import { findMySeat, describeSeat, tableOccupancy } from "@/lib/seating";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";
import SeatMapViewer from "@/components/SeatMapViewer";

export default async function SeatPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const meeting = await requirePublicMeeting((await searchParams).m);
  await guardPublicAccess(meeting.id);

  const user = await currentUser();
  const registration = user ? await getUserRegistration(user.id, meeting.id) : null;
  const [tables, seatMap] = await Promise.all([listSeatTables(meeting.id), getSeatMap(meeting.id)]);

  const mine = findMySeat(tables, { registrationId: registration?.id ?? null, guestId: null });

  return (
    <div className="space-y-4">
      <PageHeader title="我的座位" backHref={meetingHref(meeting.id, "/")} />

      {mine ? (
        <>
          <SectionCard>
            <div className="text-center">
              <p className="text-sm text-slate-500">您的座位</p>
              <p className="mt-1 text-3xl font-bold text-sky-700">
                {describeSeat({ tableName: mine.table.name, seatNo: mine.mine.seatNo })}
              </p>
              {mine.table.area && <p className="mt-1 text-sm text-slate-500">{mine.table.area}</p>}
              <p className="mt-2 text-xs text-slate-400">
                本桌共 {tableOccupancy(mine.table).seated} 人
              </p>
            </div>
          </SectionCard>

          {mine.tableMates.length > 0 && (
            <SectionCard title="同桌人员">
              <div className="divide-y">
                {mine.tableMates.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-slate-700">
                      {m.seatNo ? `${m.seatNo}. ` : ""}
                      {m.name}
                    </span>
                    {m.org && <span className="text-xs text-slate-400">{m.org}</span>}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </>
      ) : (
        <SectionCard>
          <p className="text-slate-500">
            {tables.length === 0
              ? "暂未安排座位，请稍后再来查看。"
              : registration
                ? "尚未为您安排座位，请联系会务组。"
                : "请先完成报名后再查询座位。"}
          </p>
        </SectionCard>
      )}

      {seatMap?.seatMapUrl && (
        <SectionCard title="会场平面图">
          <SeatMapViewer url={seatMap.seatMapUrl} note={seatMap.seatMapNote} />
        </SectionCard>
      )}
    </div>
  );
}
