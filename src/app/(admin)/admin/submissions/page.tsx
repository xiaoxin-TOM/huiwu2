import Link from "next/link";
import { listSubmissions } from "@/lib/submissions";
import { requireCurrentMeeting } from "@/lib/meetings";
import { STATUS_LABEL } from "@/lib/labels";
import AdminForm from "@/components/AdminForm";

function ReviewButtons({ id }: { id: string }) {
  return (
    <div className="flex gap-2">
      <AdminForm action={`/api/admin/submissions/${id}`} redirectTo="/admin/submissions">
        <input type="hidden" name="decision" value="APPROVED" />
        <button type="submit" className="rounded bg-green-600 px-2 py-1 text-xs text-white">通过</button>
      </AdminForm>
      <AdminForm action={`/api/admin/submissions/${id}`} redirectTo="/admin/submissions">
        <input type="hidden" name="decision" value="REJECTED" />
        <button type="submit" className="rounded bg-red-600 px-2 py-1 text-xs text-white">拒绝</button>
      </AdminForm>
    </div>
  );
}

export default async function AdminSubmissionsPage() {
  const meeting = await requireCurrentMeeting();
  const subs = await listSubmissions(meeting.id);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">投稿审核</h1>
          <p className="text-sm text-gray-500">当前会议：{meeting.title}</p>
        </div>
        <Link href="/api/admin/submissions/export" download className="text-sm text-sky-700 hover:underline">导出 CSV</Link>
      </div>
      {subs.length === 0 ? (
        <p className="text-gray-500">暂无投稿。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">论文题目</th><th>作者</th><th>投稿人</th><th>状态</th><th>文件</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="py-2">{s.title}</td>
                  <td>{s.authors}</td>
                  <td>{s.user.email}</td>
                  <td className="text-sky-700">{STATUS_LABEL[s.status] ?? s.status}</td>
                  <td>
                    {s.fileUrl ? (
                      <a href={s.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline">下载</a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td><ReviewButtons id={s.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
