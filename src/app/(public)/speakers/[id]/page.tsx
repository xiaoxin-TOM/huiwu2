import { notFound } from "next/navigation";
import { getSpeakerById } from "@/lib/speakers";
import { resolveMeeting } from "@/lib/meetings";
import { meetingHref } from "@/lib/public";
import RichText from "@/components/RichText";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";
import { UsersIcon } from "@/components/icons";

export default async function SpeakerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const { id } = await params;
  const meeting = await resolveMeeting((await searchParams).m);
  const s = await getSpeakerById(id, meeting.id);
  if (!s) notFound();

  return (
    <div className="space-y-4">
      <PageHeader title="讲者详情" backHref={meetingHref(meeting.id, "/speakers")} />
      <SectionCard>
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
            <UsersIcon className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{s.name}</h2>
            <p className="text-sm text-slate-500">
              {s.title} · {s.organization}
              {s.isModerator && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">主持人</span>}
            </p>
          </div>
        </div>
        <div className="prose max-w-none text-slate-600">
          <RichText html={s.bio} />
        </div>
      </SectionCard>
    </div>
  );
}
