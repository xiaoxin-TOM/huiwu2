import Link from "next/link";
import { listAllNotices } from "@/lib/notices-admin";
import { getCurrentMeeting } from "@/lib/meetings";
import AdminForm from "@/components/AdminForm";

export default async function AdminNoticesPage() {
  const meeting = await getCurrentMeeting();
  if (!meeting) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">通知管理</h1>
        <p className="text-red-600">未选择当前会议，请先到“会议管理”选择或创建一个会议。</p>
      </div>
    );
  }
  const notices = await listAllNotices(meeting.id);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">通知管理</h1>

      <AdminForm action="/api/admin/notices" redirectTo="/admin/notices" className="space-y-2 rounded border p-4">
        <h2 className="font-medium">新建通知</h2>
        <input name="title" required placeholder="标题" className="w-full rounded border px-3 py-2" />
        <textarea name="contentHtml" rows={4} placeholder="正文（纯文本，换行自动分段）"
          className="w-full rounded border px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" name="isPublished" defaultChecked /> 立即发布
        </label>
        <button type="submit" className="rounded bg-sky-700 px-4 py-2 text-sm text-white">新建</button>
      </AdminForm>

      {notices.length === 0 ? (
        <p className="text-gray-500">暂无通知。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">标题</th><th>状态</th><th>时间</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {notices.map((n) => (
                <tr key={n.id} className="border-b">
                  <td className="py-2">{n.title}</td>
                  <td>{n.isPublished ? "已发布" : "未发布"}</td>
                  <td>{n.publishedAt.toISOString().slice(0, 10)}</td>
                  <td className="flex gap-2 py-2">
                    <Link href={`/admin/notices/${n.id}`} className="text-sky-700 hover:underline">编辑</Link>
                    <AdminForm action={`/api/admin/notices/${n.id}/delete`} redirectTo="/admin/notices">
                      <button type="submit" className="text-red-600 hover:underline">删除</button>
                    </AdminForm>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
