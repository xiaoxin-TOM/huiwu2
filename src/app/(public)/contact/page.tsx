import { prisma } from "@/lib/prisma";
import { getPage } from "@/lib/content";
import { requirePublicMeeting, guardPublicAccess } from "@/lib/public-guard";
import { getPublicConfig } from "@/lib/public";
import RichText from "@/components/RichText";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const meeting = await requirePublicMeeting((await searchParams).m);
  await guardPublicAccess(meeting.id);
  const siteConfig = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  const cfg = getPublicConfig(meeting, siteConfig);
  const page = await getPage("contact", meeting.id);
  const html = page?.contentHtml || cfg.contactHtml;

  return (
    <div className="space-y-4">
      <PageHeader title={page?.title ?? "联系方式"} />
      <SectionCard>
        {html ? (
          <div className="prose max-w-none text-slate-600">
            <RichText html={html} />
          </div>
        ) : (
          <p className="text-slate-500">联系方式待发布。</p>
        )}
      </SectionCard>
    </div>
  );
}
