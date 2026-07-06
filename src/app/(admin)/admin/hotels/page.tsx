import Link from "next/link";
import { listHotels } from "@/lib/hotels";
import { getCurrentMeeting } from "@/lib/meetings";
import AdminForm from "@/components/AdminForm";

export default async function AdminHotelsPage() {
  const meeting = await getCurrentMeeting();
  if (!meeting) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">酒店管理</h1>
        <p className="text-red-600">未选择当前会议，请先到“会议管理”选择或创建一个会议。</p>
      </div>
    );
  }
  const hotels = await listHotels(meeting.id);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">酒店管理</h1>

      <AdminForm action="/api/admin/hotels" redirectTo="/admin/hotels" className="grid grid-cols-2 gap-2 rounded border p-4">
        <input name="name" required placeholder="名称" className="rounded border px-3 py-2" />
        <input name="price" type="number" min={0} defaultValue={0} placeholder="价格/晚" className="rounded border px-3 py-2" />
        <input name="address" placeholder="地址" className="rounded border px-3 py-2" />
        <input name="distance" placeholder="距离" className="rounded border px-3 py-2" />
        <input name="imageUrl" placeholder="图片地址(可选)" className="col-span-2 rounded border px-3 py-2" />
        <textarea name="description" rows={2} placeholder="简介(HTML)" className="col-span-2 rounded border px-3 py-2 font-mono text-sm" />
        <button type="submit" className="rounded bg-sky-700 px-4 py-2 text-sm text-white">新建酒店</button>
      </AdminForm>

      {hotels.length === 0 ? (
        <p className="text-gray-500">暂无酒店。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">名称</th><th>价格</th><th>地址</th><th>距离</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {hotels.map((h) => (
                <tr key={h.id} className="border-b">
                  <td className="py-2">{h.name}</td>
                  <td>¥{h.price}</td>
                  <td>{h.address}</td>
                  <td>{h.distance}</td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <Link href={`/admin/hotels/${h.id}`} className="text-sky-700 hover:underline">编辑</Link>
                      <AdminForm action={`/api/admin/hotels/${h.id}/delete`} redirectTo="/admin/hotels">
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
