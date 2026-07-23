import { notFound } from "next/navigation";
import { requirePublicMeeting, guardPublicAccess } from "@/lib/public-guard";
import { getLiveStreamById } from "@/lib/live";
import { meetingHref } from "@/lib/public";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";
import { VideoIcon, ExternalLinkIcon } from "@/components/icons";

export default async function LiveDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const { id } = await params;
  const meeting = await requirePublicMeeting((await searchParams).m);
  await guardPublicAccess(meeting.id);

  const item = await getLiveStreamById(id, meeting.id);
  if (!item || !item.isVisible) notFound();

  const backHref = meeting.liveMultiButton ? meetingHref(meeting.id, "/") : "/live";
  const displayImage = meeting.liveMultiButton ? item.introImage : item.coverImage;

  return (
    <div className="space-y-4">
      <PageHeader title={item.name} backHref={backHref} />
      <SectionCard className="overflow-hidden p-0">
        <div className="p-4">
          {meeting.liveMultiButton ? (
            <>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-medium text-white transition hover:bg-sky-700"
              >
                <ExternalLinkIcon className="h-4 w-4" />
                进入直播
              </a>
              {item.time && <p className="mb-2 text-sm font-medium text-sky-700">{item.time}</p>}
              {item.description && <p className="text-sm text-slate-500">{item.description}</p>}
            </>
          ) : (
            <>
              {item.time && <p className="mb-2 text-sm font-medium text-sky-700">{item.time}</p>}
              {item.description && <p className="mb-4 text-sm text-slate-500">{item.description}</p>}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-medium text-white transition hover:bg-sky-700"
              >
                <ExternalLinkIcon className="h-4 w-4" />
                进入直播
              </a>
            </>
          )}
        </div>
        {displayImage ? (
          <div className="w-full overflow-hidden bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={displayImage} alt={`${item.name} 介绍图片`} className="block h-auto w-full" />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-sky-50 text-sky-600">
            <VideoIcon className="h-12 w-12" />
          </div>
        )}
      </SectionCard>
    </div>
  );
}
