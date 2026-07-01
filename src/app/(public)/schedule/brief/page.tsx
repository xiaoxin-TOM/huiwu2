import { getBriefSessions } from "@/lib/schedule";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";
import { ClockIcon, MapPinIcon } from "@/components/icons";

export default async function BriefSchedulePage() {
  const sessions = await getBriefSessions();
  const days = Array.from(new Set(sessions.map((s) => s.day)));

  return (
    <div className="space-y-5">
      <PageHeader title="简明日程" />
      {sessions.length === 0 ? (
        <p className="text-slate-500">日程待发布。</p>
      ) : (
        days.map((day) => (
          <SectionCard key={day} title={day}>
            <div className="grid gap-3 sm:grid-cols-2">
              {sessions
                .filter((s) => s.day === day)
                .map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-sky-200 hover:bg-sky-50/30"
                  >
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-sky-700">
                      <ClockIcon className="h-4 w-4" />
                      {s.startTime}–{s.endTime}
                    </div>
                    <h4 className="mb-2 font-semibold text-slate-800">{s.title}</h4>
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPinIcon className="h-3.5 w-3.5" />
                      {s.room}
                    </p>
                  </div>
                ))}
            </div>
          </SectionCard>
        ))
      )}
    </div>
  );
}
