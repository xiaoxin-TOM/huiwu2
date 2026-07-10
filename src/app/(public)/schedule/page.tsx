import { getDetailedSessions, groupByDayAndRoom } from "@/lib/schedule";
import { requirePublicMeeting, guardPublicAccess } from "@/lib/public-guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";
import { ClockIcon, UsersIcon, CalendarIcon } from "@/components/icons";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const meeting = await requirePublicMeeting((await searchParams).m);
  await guardPublicAccess(meeting.id);
  const grouped = groupByDayAndRoom(await getDetailedSessions(meeting.id));
  return (
    <div className="space-y-5">
      <PageHeader title="详细日程" />
      {grouped.length === 0 ? (
        <p className="text-slate-500">日程待发布。</p>
      ) : (
        grouped.map((day) => (
          <SectionCard key={day.day} title={day.day}>
            <div className="space-y-5">
              {day.rooms.map((room) => (
                <div key={room.room}>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-sky-700">
                    <CalendarIcon className="h-4 w-4" />
                    {room.room}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {room.sessions.map((s) => {
                      const sessionSpeakers = s.speakers ?? [];
                      const speakers = sessionSpeakers
                        .filter((x) => x.role === "SPEAKER")
                        .map((x) => x.speaker?.name ?? "未知讲者");
                      const moderators = sessionSpeakers
                        .filter((x) => x.role === "MODERATOR")
                        .map((x) => x.speaker?.name ?? "未知主持");
                      return (
                        <div
                          key={s.id}
                          className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-sky-200 hover:bg-sky-50/30"
                        >
                          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-sky-700">
                            <ClockIcon className="h-4 w-4" />
                            {s.startTime}–{s.endTime}
                          </div>
                          <h4 className="mb-2 font-semibold text-slate-800">{s.title}</h4>
                          {speakers.length > 0 && (
                            <p className="flex items-center gap-1 text-xs text-slate-500">
                              <UsersIcon className="h-3.5 w-3.5" />
                              讲者：{speakers.join("、")}
                            </p>
                          )}
                          {moderators.length > 0 && (
                            <p className="mt-1 text-xs text-slate-400">主持：{moderators.join("、")}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        ))
      )}
    </div>
  );
}
