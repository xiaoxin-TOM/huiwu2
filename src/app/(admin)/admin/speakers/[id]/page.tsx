import { notFound } from "next/navigation";
import { getSpeakerById } from "@/lib/speakers";
import { getCurrentMeeting } from "@/lib/meetings";
import AdminForm from "@/components/AdminForm";

export default async function EditSpeakerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meeting = await getCurrentMeeting();
  if (!meeting) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold">编辑讲者</h1>
        <p className="text-red-600">未选择当前会议，请先到“会议管理”选择或创建一个会议。</p>
      </div>
    );
  }
  const s = await getSpeakerById(id, meeting.id);
  if (!s) notFound();
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">编辑讲者</h1>
      <AdminForm action={`/api/admin/speakers/${s.id}`} redirectTo="/admin/speakers" className="space-y-3">
        <input name="name" required defaultValue={s.name} className="w-full rounded border px-3 py-2" />
        <input name="title" defaultValue={s.title} placeholder="职称" className="w-full rounded border px-3 py-2" />
        <input name="organization" defaultValue={s.organization} placeholder="单位" className="w-full rounded border px-3 py-2" />
        <input name="photoUrl" defaultValue={s.photoUrl ?? ""} placeholder="照片地址" className="w-full rounded border px-3 py-2" />
        <label className="block text-sm text-gray-600">简介（纯文本，换行自动分段）
          <textarea name="bio" rows={5} defaultValue={s.bio} className="mt-1 w-full rounded border px-3 py-2 text-sm" />
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" name="isModerator" defaultChecked={s.isModerator} /> 主持人
        </label>
        <button type="submit" className="rounded bg-sky-700 px-4 py-2 text-white">保存</button>
      </AdminForm>
    </div>
  );
}
