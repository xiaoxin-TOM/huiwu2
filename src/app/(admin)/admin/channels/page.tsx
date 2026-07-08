import { requireCurrentMeeting } from "@/lib/meetings";
import { channelStats } from "@/lib/channels-admin";
import AdminForm from "@/components/AdminForm";
import { ButtonLink } from "@/components/ui/Button";
import { DownloadIcon } from "@/components/icons";

export default async function AdminChannelsPage() {
  const meeting = await requireCurrentMeeting();
  const stats = await channelStats(meeting.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">渠道推广管理</h1>
        <div className="flex items-center gap-2">
          <ButtonLink href="/api/admin/channels/export" download variant="secondary" size="sm">
            <DownloadIcon className="h-4 w-4" /> 导出 CSV
          </ButtonLink>
          <ButtonLink href="/admin/channels/new" variant="primary" size="sm">
            + 新建渠道
          </ButtonLink>
        </div>
      </div>

      {stats.length === 0 ? (
        <p className="text-gray-500">暂无渠道。</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="px-4 py-3">名称</th>
                <th className="px-4 py-3">短码</th>
                <th className="px-4 py-3">专属链接</th>
                <th className="px-4 py-3">负责人</th>
                <th className="px-4 py-3">PV</th>
                <th className="px-4 py-3">UV</th>
                <th className="px-4 py-3">报名</th>
                <th className="px-4 py-3">签到</th>
                <th className="px-4 py-3">转化率</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.code}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`/register-conf?ch=${encodeURIComponent(s.code)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-sky-700 hover:underline"
                    >
                      /register-conf?ch={s.code}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{s.owner || "-"}</td>
                  <td className="px-4 py-3">{s.pv}</td>
                  <td className="px-4 py-3">{s.uv}</td>
                  <td className="px-4 py-3">{s.registrations}</td>
                  <td className="px-4 py-3">{s.checkins}</td>
                  <td className="px-4 py-3">{s.conversion}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <ButtonLink href={`/admin/channels/${s.id}/edit`} variant="secondary" size="xs">
                        编辑
                      </ButtonLink>
                      <AdminForm action={`/api/admin/channels/${s.id}/delete`} redirectTo="/admin/channels" className="inline">
                        <button type="submit" className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100">
                          删除
                        </button>
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
