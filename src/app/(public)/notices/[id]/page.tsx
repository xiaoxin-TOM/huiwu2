import { notFound } from "next/navigation";
import { getNoticeById } from "@/lib/content";
import { requirePublicMeeting, guardPublicAccess } from "@/lib/public-guard";
import { meetingHref } from "@/lib/public";
import Image from "next/image";
import RichText from "@/components/RichText";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";

export default async function NoticeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const { id } = await params;
  const meeting = await requirePublicMeeting((await searchParams).m);
  await guardPublicAccess(meeting.id);
  const notice = await getNoticeById(id, meeting.id);
  if (!notice) notFound();

  return (
    <div className="space-y-4">
      <PageHeader title="通知详情" backHref={meetingHref(meeting.id, "/notices")} />
      <SectionCard>
        <h2 className="mb-2 text-xl font-bold text-slate-800">{notice.title}</h2>
        <p className="mb-4 text-sm text-slate-400">{notice.publishedAt.toISOString().slice(0, 10)}</p>
        {notice.mode === "IMAGE" ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            <Image src={notice.imageUrl ?? ""} alt={notice.title} fill className="object-contain" sizes="100vw" />
          </div>
        ) : (
          <div className="prose max-w-none text-slate-600">
            <RichText html={notice.contentHtml} />
          </div>
        )}
      </SectionCard>
    </div>
  );
}
