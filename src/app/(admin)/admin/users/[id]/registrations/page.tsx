import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getUserById } from "@/lib/users-admin";
import { listUserRegistrationsAcrossMeetings } from "@/lib/registrations";
import { STATUS_LABEL } from "@/lib/labels";
import { SectionCard } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowLeftIcon } from "@/components/icons";

export default async function UserRegistrationsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const user = await getUserById(id);
  if (!user) notFound();

  const registrations = await listUserRegistrationsAcrossMeetings(id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">用户报名记录</h1>
          <p className="text-sm text-gray-500">
            {user.name} · {user.email}
          </p>
        </div>
        <ButtonLink href="/admin/users" variant="secondary" size="sm">
          <ArrowLeftIcon className="h-4 w-4" />
          返回用户列表
        </ButtonLink>
      </div>

      <SectionCard>
        {registrations.length === 0 ? (
          <p className="text-gray-500">该用户暂无任何会议报名记录。</p>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="px-4 py-3">会议名称</th>
                  <th className="px-4 py-3">报名类型</th>
                  <th className="px-4 py-3">姓名</th>
                  <th className="px-4 py-3">单位</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">报名时间</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="px-4 py-3 font-medium">{r.meeting.title}</td>
                    <td className="px-4 py-3">{r.type.name}</td>
                    <td className="px-4 py-3">{r.fullName}</td>
                    <td className="px-4 py-3 text-gray-500">{r.organization || "-"}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-sky-700">
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {r.createdAt.toLocaleString("zh-CN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
