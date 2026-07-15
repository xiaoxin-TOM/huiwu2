import Image from "next/image";
import { prisma } from "@/lib/prisma";
import RichText from "@/components/RichText";
import HomeGrid from "@/components/HomeGrid";
import { requirePublicMeeting, guardPublicAccess } from "@/lib/public-guard";
import { getPublicConfig } from "@/lib/public";
import { listHomeGridItems } from "@/lib/home-grid";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const meeting = await requirePublicMeeting((await searchParams).m);
  await guardPublicAccess(meeting.id);
  const [siteConfig, homeGridItems] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { id: 1 } }),
    listHomeGridItems(meeting.id),
  ]);
  const cfg = getPublicConfig(meeting, siteConfig);

  return (
    <div className="-mx-4 -my-8 md:-mx-8">
      {/* Hero banner */}
      <section className="relative aspect-video w-full overflow-hidden">
        <Image
          src="/imgs/ui.jpg"
          alt="学术年会"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <h2 className="mb-4 text-lg font-bold text-slate-800">会议服务</h2>
        <HomeGrid meetingId={meeting.id} items={homeGridItems} />
      </section>

      {/* Welcome content */}
      {cfg.welcomeHtml && (
        <section className="mx-auto max-w-6xl px-4 pb-8 md:px-8">
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
