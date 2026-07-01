import { listSubmissions } from "@/lib/submissions";
import { STATUS_LABEL } from "@/lib/labels";

function ReviewButtons({ id }: { id: string }) {
  return (
    <div className="flex gap-2">
      <form action={`/api/admin/submissions/${id}`} method="post">
        <input type="hidden" name="decision" value="APPROVED" />
        <button type="submit" className="rounded bg-green-600 px-2 py-1 text-xs text-white">通过</button>
      </form>
      <form action={`/api/admin/submissions/${id}`} method="post">
        <input type="hidden" name="decision" value="REJECTED" />
        <button type="submit" className="rounded bg-red-600 px-2 py-1 text-xs text-white">拒绝</button>
      </form>
    </div>
  );
}

export default async function AdminSubmissionsPage() {
  const subs = await listSubmissions();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">论文管理</h1>
        <a href="/api/admin/submissions/export" className="text-sm text-sky-700 hover:underline">导出 CSV</a>
      </div>
      {subs.length === 0 ? (
        <p className="text-gray-500">暂无投稿。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">题目</th><th>作者</th><th>提交人</th><th>PDF</th><th>状态</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id} className="border-b align-top">
                  <td className="py-2">{s.title}</td>
                  <td>{s.authors}</td>
                  <td>{s.user.email}</td>
                  <td>
                    {s.fileUrl ? (
                      <a href={s.fileUrl} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">下载</a>
                    ) : (
                      <span className="text-gray-400">无</span>
                    )}
                  </td>
                  <td className="text-sky-700">{STATUS_LABEL[s.status] ?? s.status}</td>
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
