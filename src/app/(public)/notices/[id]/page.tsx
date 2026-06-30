import { notFound } from "next/navigation";
import { getNoticeById } from "@/lib/content";
import RichText from "@/components/RichText";

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notice = await getNoticeById(id);
  if (!notice) notFound();
  return (
    <article className="space-y-4">
      <h1 className="text-2xl font-bold">{notice.title}</h1>
      <p className="text-sm text-gray-400">
        {notice.publishedAt.toISOString().slice(0, 10)}
      </p>
      <RichText html={notice.contentHtml} />
    </article>
  );
}
