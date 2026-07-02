import Link from "next/link";
import { getAllSpeakers } from "@/lib/speakers";

export default async function AdminSpeakersPage() {
  const speakers = await getAllSpeakers();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">讲者管理</h1>

      <form action="/api/admin/speakers" method="post" className="space-y-2 rounded border p-4">
        <h2 className="font-medium">新建讲者</h2>
        <input name="name" required placeholder="姓名" className="w-full rounded border px-3 py-2" />
        <input name="title" placeholder="职称" className="w-full rounded border px-3 py-2" />
        <input name="organization" placeholder="单位" className="w-full rounded border px-3 py-2" />
        <input name="photoUrl" placeholder="照片地址(可选)" className="w-full rounded border px-3 py-2" />
        <textarea name="bio" rows={3} placeholder="简介(HTML)" className="w-full rounded border px-3 py-2 font-mono text-sm" />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" name="isModerator" /> 主持人
        </label>
        <button type="submit" className="rounded bg-sky-700 px-4 py-2 text-sm text-white">新建</button>
      </form>

      {speakers.length === 0 ? (
        <p className="text-gray-500">暂无讲者。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">姓名</th><th>职称</th><th>单位</th><th>角色</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {speakers.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="py-2">{s.name}</td>
                  <td>{s.title}</td>
                  <td>{s.organization}</td>
                  <td>{s.isModerator ? "主持人" : "讲者"}</td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <Link href={`/admin/speakers/${s.id}`} className="text-sky-700 hover:underline">编辑</Link>
                      <form action={`/api/admin/speakers/${s.id}/delete`} method="post">
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
