import { notFound } from "next/navigation";
import { getUserById } from "@/lib/users-admin";
import AdminForm from "@/components/AdminForm";
import { ButtonLink } from "@/components/ui/Button";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserById(id);
  if (!user) notFound();

  return (
    <div className="max-w-md space-y-4">
      <div className="flex items-center gap-3">
        <ButtonLink href="/admin/users" variant="secondary" size="sm">
          ← 返回
        </ButtonLink>
        <h1 className="text-2xl font-bold">编辑用户</h1>
      </div>
      <AdminForm action={`/api/admin/users/${user.id}`} redirectTo="/admin/users" className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
        <div>
          <label className="block text-sm text-gray-600">姓名 *</label>
          <input name="name" defaultValue={user.name} required className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">邮箱 *</label>
          <input type="email" name="email" defaultValue={user.email} required className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">新密码（留空则不修改）</label>
          <input type="password" name="password" minLength={6} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">角色</label>
          <select name="role" defaultValue={user.role} className="mt-1 w-full rounded-lg border px-3 py-2">
            <option value="USER">用户</option>
            <option value="ADMIN">管理员</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" name="isActive" value="on" id="isActive" defaultChecked={user.isActive} />
          <label htmlFor="isActive" className="text-sm text-gray-600">启用</label>
        </div>
        <button type="submit" className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800">
          保存
        </button>
      </AdminForm>
    </div>
  );
}
