import Link from "next/link";
import { listSessionsAdmin } from "@/lib/schedule-admin";

export default async function AdminSchedulePage() {
  const sessions = await listSessionsAdmin();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">日程管理</h1>

      <form action="/api/admin/sessions" method="post" className="grid grid-cols-2 gap-2 rounded border p-4 sm:grid-cols-3">
        <input name="day" type="date" required className="rounded border px-2 py-1.5 text-sm" />
        <input name="startTime" placeholder="开始 09:00" required className="rounded border px-2 py-1.5 text-sm" />
        <input name="endTime" placeholder="结束 10:00" required className="rounded border px-2 py-1.5 text-sm" />
        <input name="room" placeholder="会场" className="rounded border px-2 py-1.5 text-sm" />
        <input name="title" placeholder="场次标题" required className="rounded border px-2 py-1.5 text-sm sm:col-span-2" />
        <button type="submit" className="rounded bg-sky-700 px-3 py-1.5 text-sm text-white">新建场次</button>
      </form>

      {sessions.length === 0 ? (
        <p className="text-gray-500">暂无场次。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">日期</th><th>时间</th><th>会场</th><th>标题</th><th>讲者</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="py-2">{s.day}</td>
                  <td>{s.startTime}–{s.endTime}</td>
                  <td>{s.room}</td>
                  <td>{s.title}</td>
                  <td>{s.speakers.map((x) => x.speaker.name).join("、")}</td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <Link href={`/admin/schedule/${s.id}`} className="text-sky-700 hover:underline">编辑</Link>
                      <form action={`/api/admin/sessions/${s.id}/delete`} method="post">
                        <button type="submit" className="text-red-600 hover:underline">删除</button>
                      </form>
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
