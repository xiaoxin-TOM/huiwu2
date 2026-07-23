import { notFound } from "next/navigation";
import { getNotice } from "@/lib/notices-admin";
import { getCurrentMeeting } from "@/lib/meetings";
import NoticeEditor from "@/components/NoticeEditor";

export default async function EditNoticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meeting = await getCurrentMeeting();
  if (!meeting) {
    return (
      <div className="max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold">编辑通知</h1>
        <p className="text-red-600">未选择当前会议，请先到“会议管理”选择或创建一个会议。</p>
      </div>
    );
  }
  const notice = await getNotice(id, meeting.id);
  if (!notice) notFound();
  return (
    <NoticeEditor
      notice={{
        id: notice.id,
        title: notice.title,
        contentHtml: notice.contentHtml,
        isPublished: notice.isPublished,
        mode: notice.mode,
        imageUrl: notice.imageUrl,
      }}
      redirectTo="/admin/pages"
    />
  );
}
