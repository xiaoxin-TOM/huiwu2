import { listRegistrations, listRegistrationTypes, countRegistrationsByType } from "@/lib/registrations";
import { requireCurrentMeeting } from "@/lib/meetings";
import { STATUS_LABEL } from "@/lib/labels";
import AdminForm from "@/components/AdminForm";
import RegistrationTypeEditor from "@/components/RegistrationTypeEditor";
import { ButtonLink } from "@/components/ui/Button";

function ReviewButtons({ id }: { id: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <AdminForm action={`/api/admin/registrations/${id}`} redirectTo="/admin/registrations">
        <input type="hidden" name="decision" value="APPROVED" />
        <button type="submit" className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700">
          通过
        </button>
      </AdminForm>
      <AdminForm action={`/api/admin/registrations/${id}`} redirectTo="/admin/registrations">
        <input type="hidden" name="decision" value="REJECTED" />
        <button type="submit" className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700">
          拒绝
        </button>
      </AdminForm>
    </div>
  );
}

export default async function AdminRegistrationsPage() {
  const meeting = await requireCurrentMeeting();
  const [regs, types] = await Promise.all([listRegistrations(meeting.id), listRegistrationTypes()]);
  const counts = await Promise.all(types.map((t) => countRegistrationsByType(t.id)));
  const registrationCounts = Object.fromEntries(types.map((t, i) => [t.id, counts[i]]));

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">报名管理</h1>
            <p className="text-sm text-gray-500">当前会议：{meeting.title}</p>
          </div>
          <ButtonLink href="/api/admin/registrations/export" download variant="secondary" size="sm">
            导出 CSV
          </ButtonLink>
        </div>
        {regs.length === 0 ? (
          <p className="text-gray-500">暂无报名。</p>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="px-4 py-3">姓名</th>
                  <th className="px-4 py-3">邮箱</th>
                  <th className="px-4 py-3">类型</th>
                  <th className="px-4 py-3">单位</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">签到</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {regs.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="px-4 py-3">{r.fullName}</td>
                    <td className="px-4 py-3">{r.user.email}</td>
                    <td className="px-4 py-3">{r.type.name}</td>
                    <td className="px-4 py-3">{r.organization}</td>
                    <td className="px-4 py-3 text-sky-700">{STATUS_LABEL[r.status] ?? r.status}</td>
                    <td className="px-4 py-3">
                      {r.checkedIn ? (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700" title={r.checkedInAt?.toLocaleString("zh-CN")}>
                          已签到
                        </span>
                      ) : (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">未签到</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><ReviewButtons id={r.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">参会类型设置</h2>
        <p className="mb-4 text-sm text-gray-500">修改后前台报名表单和接待管理中的类型筛选将同步更新。删除已有报名的类型时，可将报名批量转移到其他类型。</p>
        <RegistrationTypeEditor
          initialTypes={types.map((t) => ({ id: t.id, name: t.name, fee: t.fee, description: t.description }))}
          registrationCounts={registrationCounts}
        />
      </div>
    </div>
  );
}
