import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getPage } from "@/lib/content";
import { requirePublicMeeting, guardPublicAccess } from "@/lib/public-guard";
import { getPublicConfig, meetingHref } from "@/lib/public";
import { getMeetingContact } from "@/lib/feedback";
import { hasAnyContactInfo } from "@/lib/meeting-contact";
import RichText from "@/components/RichText";
import ContactInfoBlock from "@/components/ContactInfoBlock";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const meeting = await requirePublicMeeting((await searchParams).m);
  await guardPublicAccess(meeting.id);
  const [siteConfig, page, contact] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { id: 1 } }),
    getPage("contact", meeting.id),
    getMeetingContact(meeting.id),
  ]);
  const cfg = getPublicConfig(meeting, siteConfig);
  const html = page?.contentHtml || cfg.contactHtml;
  const hasStructured = hasAnyContactInfo(contact);
  const hasRichContent = Boolean((page?.mode === "IMAGE" && page.imageUrl) || html);

  return (
    <div className="space-y-4">
      <PageHeader title={page?.title ?? "联系方式"} backHref={meetingHref(meeting.id, "/")} />

      {hasStructured && contact && <ContactInfoBlock contact={contact} />}

      {/* 原有富文本保留在结构化信息下方，未配置结构化字段时表现与改造前一致 */}
      {hasRichContent && (
        <SectionCard title={hasStructured ? "更多说明" : undefined}>
          {page?.mode === "IMAGE" && page.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={page.imageUrl} alt={page.title} className="w-full rounded-lg" />
          ) : (
            <div className="prose max-w-none text-slate-600">
              <RichText html={html} />
            </div>
          )}
        </SectionCard>
      )}

      {!hasStructured && !hasRichContent && (
        <SectionCard>
          <p className="text-slate-500">联系方式待发布。</p>
        </SectionCard>
      )}

      <Link
        href={meetingHref(meeting.id, "/feedback")}
        className="block rounded-xl bg-sky-700 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-sky-800"
      >
        有问题或建议？点此提交反馈
      </Link>
    </div>
  );
}
