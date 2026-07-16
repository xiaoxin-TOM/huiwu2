import { prisma } from "@/lib/prisma";
import { requirePublicMeeting, guardPublicAccess } from "@/lib/public-guard";
import { getPublicConfig } from "@/lib/public";
import { listVisibleLiveStreams } from "@/lib/live";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";
import { VideoIcon, ExternalLinkIcon } from "@/components/icons";

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const meeting = await requirePublicMeeting((await searchParams).m);
  await guardPublicAccess(meeting.id);
  const siteConfig = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  const cfg = getPublicConfig(meeting, siteConfig);
  const liveStreams = await listVisibleLiveStreams(meeting.id);

  // 兼容旧版单一直播地址
  const items = liveStreams.length > 0
    ? liveStreams
    : cfg.liveUrl
      ? [{ id: "legacy", name: "会议直播", url: cfg.liveUrl, coverImage: "", description: "", time: "" }]
      : [];

  return (
    <div className="space-y-4">
      <PageHeader title="现场直播" />
      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <SectionCard key={item.id} className="overflow-hidden p-0">
              {item.coverImage ? (
                <div className="aspect-video w-full overflow-hidden bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.coverImage} alt={`${item.name} 封面`} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-sky-50 text-sky-600">
                  <VideoIcon className="h-12 w-12" />
                </div>
              )}
              <div className="p-4">
                <h2 className="mb-2 text-lg font-bold text-slate-800">{item.name}</h2>
                {item.time && <p className="mb-1 text-sm font-medium text-sky-700">{item.time}</p>}
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
              </div>
            </SectionCard>
          ))}
        </div>
      ) : (
        <SectionCard>
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <VideoIcon className="h-10 w-10" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-slate-700">直播暂未开始</h2>
            <p className="text-sm text-slate-500">敬请期待，直播链接发布后将在此显示。</p>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
