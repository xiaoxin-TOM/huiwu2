import { getPage } from "@/lib/content";
import { requirePublicMeeting, guardPublicAccess } from "@/lib/public-guard";
import RichText from "@/components/RichText";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";

/** 纯内容展示页(活动简介/说明/须知等):按 slug 读取当前会议的内容页并渲染。 */
export default async function SimpleContentPage({
  slug,
  fallbackTitle,
  emptyText,
  m,
}: {
  slug: string;
  fallbackTitle: string;
  emptyText: string;
  m?: string;
}) {
  const meeting = await requirePublicMeeting(m);
  await guardPublicAccess(meeting.id);
  const page = await getPage(slug, meeting.id);
  return (
    <div className="space-y-4">
      <PageHeader title={page?.title ?? fallbackTitle} />
      <SectionCard>
        {page?.contentHtml ? (
          <div className="prose max-w-none text-slate-600">
            <RichText html={page.contentHtml} />
          </div>
        ) : (
          <p className="text-slate-500">{emptyText}</p>
        )}
      </SectionCard>
    </div>
  );
}
