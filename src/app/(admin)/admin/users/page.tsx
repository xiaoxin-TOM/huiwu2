import { auth } from "@/lib/auth";
import { listUsers } from "@/lib/users-admin";

export default async function AdminUsersPage() {
  const [session, users] = await Promise.all([auth(), listUsers()]);
  const selfId = session?.user?.id;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">用户管理</h1>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">姓名</th><th>邮箱</th><th>角色</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="py-2">{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role === "ADMIN" ? "管理员" : "用户"}</td>
                <td className="py-2">
                  {u.id === selfId ? (
                    <span className="text-gray-400">当前账号</span>
                  ) : (
                    <form action={`/api/admin/users/${u.id}/role`} method="post" className="flex items-center gap-2">
                      <select name="role" defaultValue={u.role} className="rounded border px-2 py-1 text-sm">
                        <option value="USER">用户</option>
                        <option value="ADMIN">管理员</option>
                      </select>
                      <button type="submit" className="rounded bg-sky-700 px-2 py-1 text-xs text-white">设为</button>
                    </form>
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
