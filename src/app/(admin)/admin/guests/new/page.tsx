import Link from "next/link";
import AdminForm from "@/components/AdminForm";

export default function NewGuestPage() {
  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/admin/guests" className="text-sm text-sky-700 hover:underline">← 返回</Link>
        <h1 className="text-2xl font-bold">新建嘉宾</h1>
      </div>
      <AdminForm action="/api/admin/guests" redirectTo="/admin/guests" className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
        <div>
          <label className="block text-sm text-gray-600">姓名 *</label>
          <input name="name" required className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600">手机</label>
            <input name="phone" className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">邮箱</label>
            <input name="email" type="email" className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600">单位</label>
            <input name="company" className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">职位</label>
            <input name="title" className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600">级别</label>
          <select name="level" defaultValue="NORMAL" className="mt-1 w-full rounded-lg border px-3 py-2">
            <option value="VIP">VIP</option>
            <option value="NORMAL">嘉宾</option>
            <option value="MEDIA">媒体</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600">简介</label>
          <textarea name="bio" rows={3} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">备注</label>
          <textarea name="note" rows={2} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">座位信息</label>
          <input name="seatInfo" className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <button type="submit" className="rounded-lg bg-sky-700 px-4 py-2 text-white hover:bg-sky-800">保存</button>
      </AdminForm>
    </div>
  );
}
