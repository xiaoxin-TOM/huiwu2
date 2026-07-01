import { notFound } from "next/navigation";
import { getNoticeById } from "@/lib/content";
import RichText from "@/components/RichText";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notice = await getNoticeById(id);
  if (!notice) notFound();

  return (
    <div className="space-y-4">
      <PageHeader title="通知详情" backHref="/notices" />
      <SectionCard>
        <h2 className="mb-2 text-xl font-bold text-slate-800">{notice.title}</h2>
        <p className="mb-4 text-sm text-slate-400">{notice.publishedAt.toISOString().slice(0, 10)}</p>
        <div className="prose max-w-none text-slate-600">
          <RichText html={notice.contentHtml} />
        </div>
      </SectionCard>
    </div>
  );
}
