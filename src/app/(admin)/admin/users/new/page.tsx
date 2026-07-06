import Link from "next/link";
import AdminForm from "@/components/AdminForm";

export default function NewUserPage() {
  return (
    <div className="max-w-md space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/admin/users" className="text-sm text-sky-700 hover:underline">← 返回</Link>
        <h1 className="text-2xl font-bold">新建用户</h1>
      </div>
      <AdminForm action="/api/admin/users" redirectTo="/admin/users" className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
        <div>
          <label className="block text-sm text-gray-600">姓名 *</label>
          <input name="name" required className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">邮箱 *</label>
          <input type="email" name="email" required className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">密码 *（默认 111111）</label>
          <input type="password" name="password" defaultValue="111111" required minLength={6} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">角色</label>
          <select name="role" className="mt-1 w-full rounded-lg border px-3 py-2">
            <option value="USER">用户</option>
            <option value="ADMIN">管理员</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" name="isActive" value="on" id="isActive" defaultChecked />
          <label htmlFor="isActive" className="text-sm text-gray-600">启用</label>
        </div>
        <button type="submit" className="rounded-lg bg-sky-700 px-4 py-2 text-white hover:bg-sky-800">保存</button>
      </AdminForm>
    </div>
  );
}
