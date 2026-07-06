import { requireCurrentMeeting } from "@/lib/meetings";
import { getBadgeTemplate } from "@/lib/badge-template";
import AdminBadgeTemplateForm from "@/components/AdminBadgeTemplateForm";

export default async function AdminBadgeTemplatePage() {
  const meeting = await requireCurrentMeeting();
  const template = await getBadgeTemplate(meeting.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">胸卡模板</h1>
        <p className="text-sm text-gray-500">当前会议：{meeting.title}</p>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <AdminBadgeTemplateForm defaultValues={template} />
      </div>
    </div>
  );
}
