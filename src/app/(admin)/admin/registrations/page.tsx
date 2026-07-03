import Link from "next/link";
import { listRegistrations } from "@/lib/registrations";
import { STATUS_LABEL } from "@/lib/labels";
import AdminForm from "@/components/AdminForm";

function ReviewButtons({ id }: { id: string }) {
  return (
    <div className="flex gap-2">
      <AdminForm action={`/api/admin/registrations/${id}`} redirectTo="/admin/registrations">
        <input type="hidden" name="decision" value="APPROVED" />
        <button type="submit" className="rounded bg-green-600 px-2 py-1 text-xs text-white">通过</button>
      </AdminForm>
      <AdminForm action={`/api/admin/registrations/${id}`} redirectTo="/admin/registrations">
        <input type="hidden" name="decision" value="REJECTED" />
        <button type="submit" className="rounded bg-red-600 px-2 py-1 text-xs text-white">拒绝</button>
      </AdminForm>
    </div>
  );
}

export default async function AdminRegistrationsPage() {
  const regs = await listRegistrations();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">报名管理</h1>
        <Link href="/api/admin/registrations/export" download className="text-sm text-sky-700 hover:underline">导出 CSV</Link>
      </div>
      {regs.length === 0 ? (
        <p className="text-gray-500">暂无报名。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">姓名</th><th>邮箱</th><th>类型</th><th>单位</th><th>状态</th><th>签到</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {regs.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2">{r.fullName}</td>
                  <td>{r.user.email}</td>
                  <td>{r.type.name}</td>
                  <td>{r.organization}</td>
                  <td className="text-sky-700">{STATUS_LABEL[r.status] ?? r.status}</td>
                  <td>
                    {r.checkedIn ? (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700" title={r.checkedInAt?.toLocaleString("zh-CN")}>
                        已签到
                      </span>
                    ) : (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">未签到</span>
                    )}
                  </td>
                  <td><ReviewButtons id={r.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
