import Image from "next/image";
import { prisma } from "@/lib/prisma";
import RichText from "@/components/RichText";
import HomeGrid from "@/components/HomeGrid";
import { requirePublicMeeting, guardPublicAccess } from "@/lib/public-guard";
import { getPublicConfig } from "@/lib/public";
import { getHomeGridColumns, getHomeGridRounded, listHomeGridItems } from "@/lib/home-grid";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const meeting = await requirePublicMeeting((await searchParams).m);
  await guardPublicAccess(meeting.id, { allowPending: true });
  const [siteConfig, homeGridItems, homeGridColumns, homeGridRounded] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { id: 1 } }),
    listHomeGridItems(meeting.id),
    getHomeGridColumns(meeting.id),
    getHomeGridRounded(meeting.id),
  ]);
  const cfg = getPublicConfig(meeting, siteConfig);

  return (
    <div className="-mx-4 -my-8 md:-mx-8">
      {/* Hero banner */}
      <section className="relative aspect-video w-full overflow-hidden">
        <Image
          src={cfg.heroImageUrl ?? "/imgs/ui.jpg"}
          alt="学术年会"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-5xl px-3 py-4 md:px-6">
        <h2 className="mb-3 text-base font-bold text-slate-800">会议服务</h2>
        <HomeGrid meetingId={meeting.id} items={homeGridItems} columns={homeGridColumns} rounded={homeGridRounded} />
      </section>

      {/* Welcome content */}
      {cfg.welcomeHtml && (
        <section className="mx-auto max-w-5xl px-4 pb-8 md:px-8">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-800">会议简介</h2>
            <div className="prose max-w-none text-slate-600">
              <RichText html={cfg.welcomeHtml} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
