import Link from "next/link";
import { auth } from "@/lib/auth";
import { searchUsers } from "@/lib/users-admin";
import AdminForm from "@/components/AdminForm";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const selfId = session?.user?.id;
  const users = await searchUsers(params.q ?? "");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <Link href="/admin/users/new" className="rounded-lg bg-sky-700 px-3 py-1.5 text-sm text-white hover:bg-sky-800">
          + 新建用户
        </Link>
      </div>

      <form method="get" className="flex gap-2">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="搜索姓名、邮箱、单位"
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">搜索</button>
      </form>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="px-4 py-3">姓名</th>
              <th className="px-4 py-3">邮箱</th>
              <th className="px-4 py-3">角色</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.role === "ADMIN" ? "管理员" : "用户"}</td>
                <td className="px-4 py-3">
                  {u.isActive ? (
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">启用</span>
                  ) : (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">停用</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {u.id === selfId ? (
                    <span className="text-gray-400">当前账号</span>
                  ) : (
                    <div className="flex items-center gap-3 text-xs">
                      <Link href={`/admin/users/${u.id}/edit`} className="text-sky-700 hover:underline">编辑</Link>
                      <AdminForm action={`/api/admin/users/${u.id}/reset-password`} redirectTo="/admin/users" className="inline">
                        <button type="submit" className="text-orange-600 hover:underline">重置密码</button>
                      </AdminForm>
                      <AdminForm action={`/api/admin/users/${u.id}/delete`} redirectTo="/admin/users" className="inline">
                        <button type="submit" className="text-red-600 hover:underline">删除</button>
                      </AdminForm>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
