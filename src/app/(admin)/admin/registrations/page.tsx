import { listRegistrationTypes, countRegistrationsByType } from "@/lib/registrations";
import { requireCurrentMeeting } from "@/lib/meetings";
import RegistrationTypeEditor from "@/components/RegistrationTypeEditor";
import RegistrationsTable from "@/components/RegistrationsTable";
import { ButtonLink } from "@/components/ui/Button";

export default async function AdminRegistrationsPage() {
  const meeting = await requireCurrentMeeting();
  const types = await listRegistrationTypes();
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
        <RegistrationsTable types={types.map((t) => ({ id: t.id, name: t.name }))} />
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
