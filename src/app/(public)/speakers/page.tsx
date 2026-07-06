import { getAllSpeakers, filterSpeakers } from "@/lib/speakers";
import { resolveMeeting } from "@/lib/meetings";
import { meetingHref } from "@/lib/public";
import { DataCard, FormCard, inputClass, buttonClass } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { UsersIcon, SearchIcon } from "@/components/icons";

export default async function SpeakersPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; q?: string }>;
}) {
  const params = await searchParams;
  const meeting = await resolveMeeting(params.m);
  const { q = "" } = params;
  const speakers = filterSpeakers(await getAllSpeakers(meeting.id), q);

  return (
    <div className="space-y-4">
      <PageHeader title="讲者查询" />

      <FormCard>
        <form action={meetingHref(meeting.id, "/speakers")} method="get" className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="按姓名或单位搜索"
              className={`${inputClass} pl-9`}
            />
          </div>
          <button type="submit" className={`${buttonClass} w-auto px-5`}>
            搜索
          </button>
        </form>
      </FormCard>

      {speakers.length === 0 ? (
        <p className="text-slate-500">未找到匹配的讲者。</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {speakers.map((s) => (
            <DataCard
              key={s.id}
              href={meetingHref(meeting.id, `/speakers/${s.id}`)}
              title={s.name}
              meta={s.isModerator ? "主持人" : `${s.title} · ${s.organization}`}
              description={s.isModerator ? `${s.title} · ${s.organization}` : undefined}
              icon={<UsersIcon className="h-6 w-6" />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
