import { getCurrentMeeting } from "@/lib/meetings";
import NoticeEditor from "@/components/NoticeEditor";

export default async function NewNoticePage() {
  const meeting = await getCurrentMeeting();
  if (!meeting) {
    return (
      <div className="max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold">新建通知</h1>
        <p className="text-red-600">未选择当前会议，请先到“会议管理”选择或创建一个会议。</p>
      </div>
    );
  }
  return (
    <NoticeEditor
      notice={{ title: "", contentHtml: "", isPublished: true }}
      redirectTo="/admin/pages"
    />
  );
}
