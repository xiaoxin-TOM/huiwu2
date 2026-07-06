import { prisma } from "@/lib/prisma";
import { resolveMeeting } from "@/lib/meetings";
import { getPublicConfig } from "@/lib/public";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";
import { VideoIcon, ExternalLinkIcon } from "@/components/icons";

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const meeting = await resolveMeeting((await searchParams).m);
  const siteConfig = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  const cfg = getPublicConfig(meeting, siteConfig);
  const liveUrl = cfg.liveUrl;

  return (
    <div className="space-y-4">
      <PageHeader title="现场直播" />
      {liveUrl ? (
        <SectionCard>
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-sky-100 text-sky-600">
              <VideoIcon className="h-10 w-10" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-800">会议直播进行中</h2>
            <p className="mb-6 max-w-md text-sm text-slate-500">点击下方按钮前往直播平台观看本次会议直播。</p>
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 font-medium text-white transition hover:bg-sky-700"
            >
              <ExternalLinkIcon className="h-5 w-5" />
              进入直播
            </a>
          </div>
        </SectionCard>
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
