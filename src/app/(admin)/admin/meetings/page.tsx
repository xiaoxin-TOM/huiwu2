import Link from "next/link";
import { listMeetings, getCurrentMeeting } from "@/lib/meetings";
import AdminForm from "@/components/AdminForm";

export default async function AdminMeetingsPage() {
  const [meetings, current] = await Promise.all([listMeetings(), getCurrentMeeting()]);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">会议管理</h1>
          <p className="text-sm text-gray-500">
            当前管理会议：{current ? current.title : "无（请先选择或新建会议）"}
          </p>
        </div>
        <Link href="/admin/meetings/new" className="rounded-lg bg-sky-700 px-3 py-1.5 text-sm text-white hover:bg-sky-800">
          + 新建会议
        </Link>
      </div>
      {meetings.length === 0 ? (
        <p className="text-gray-500">暂无会议。</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="px-4 py-3">名称</th>
                <th className="px-4 py-3">地点</th>
                <th className="px-4 py-3">时间</th>
                <th className="px-4 py-3">默认</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((m) => (
                <tr key={m.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{m.title}</td>
                  <td className="px-4 py-3 text-gray-500">{m.location || "-"}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {m.startDate} {m.endDate && `~ ${m.endDate}`}
                  </td>
                  <td className="px-4 py-3">
                    {m.isDefault ? (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">默认</span>
                    ) : (
                      <AdminForm action={`/api/admin/meetings/${m.id}/default`} redirectTo="/admin/meetings" className="inline">
                        <button type="submit" className="text-xs text-sky-700 hover:underline">设为默认</button>
                      </AdminForm>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-xs">
                      <AdminForm action="/api/admin/meetings/select" redirectTo="/admin" className="inline">
                        <input type="hidden" name="id" value={m.id} />
                        <button type="submit" className="text-emerald-700 hover:underline">进入管理</button>
                      </AdminForm>
                      <Link href={`/admin/meetings/${m.id}/edit`} className="text-sky-700 hover:underline">编辑</Link>
                      <AdminForm action={`/api/admin/meetings/${m.id}/delete`} redirectTo="/admin/meetings" className="inline">
                        <button type="submit" className="text-red-600 hover:underline">删除</button>
                      </AdminForm>
                    </div>
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
