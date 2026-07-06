import { getPage } from "@/lib/content";
import { resolveMeeting } from "@/lib/meetings";
import RichText from "@/components/RichText";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";

export default async function VenuePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const meeting = await resolveMeeting((await searchParams).m);
  const page = await getPage("venue", meeting.id);
  return (
    <div className="space-y-4">
      <PageHeader title={page?.title ?? "会场交通"} />
      <SectionCard>
        {page ? (
          <div className="prose max-w-none text-slate-600">
            <RichText html={page.contentHtml} />
          </div>
        ) : (
          <p className="text-slate-500">交通信息待发布。</p>
        )}
      </SectionCard>
    </div>
  );
}
