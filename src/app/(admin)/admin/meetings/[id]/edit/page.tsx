import { notFound } from "next/navigation";
import { getMeetingById } from "@/lib/meetings";
import AdminForm from "@/components/AdminForm";
import { ButtonLink } from "@/components/ui/Button";

export default async function EditMeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meeting = await getMeetingById(id);
  if (!meeting) notFound();

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        <ButtonLink href="/admin/meetings" variant="secondary" size="sm">
          ← 返回
        </ButtonLink>
        <h1 className="text-2xl font-bold">编辑会议</h1>
      </div>
      <AdminForm action={`/api/admin/meetings/${meeting.id}`} redirectTo="/admin/meetings" className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
        <div>
          <label className="block text-sm text-gray-600">会议名称 *</label>
          <input name="title" defaultValue={meeting.title} required className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">地点</label>
          <input name="location" defaultValue={meeting.location} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600">开始日期</label>
            <input type="date" name="startDate" defaultValue={meeting.startDate} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">结束日期</label>
            <input type="date" name="endDate" defaultValue={meeting.endDate} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600">简介</label>
          <textarea name="description" defaultValue={meeting.description} rows={3} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" name="requireApproval" value="on" id="requireApproval" defaultChecked={meeting.requireApproval} />
          <label htmlFor="requireApproval" className="text-sm text-gray-600">报名后需要审核</label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600">开放报名</label>
            <input type="datetime-local" name="opensAt" defaultValue={meeting.opensAt ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">截止报名</label>
            <input type="datetime-local" name="closesAt" defaultValue={meeting.closesAt ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600">人数上限</label>
          <input type="number" name="registrationLimit" min={0} defaultValue={meeting.registrationLimit ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <button type="submit" className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800">
          保存
        </button>
      </AdminForm>
    </div>
  );
}
