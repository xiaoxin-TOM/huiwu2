import { requireAdmin } from "@/lib/session";
import { listMeetingsForUser, getSelectedMeeting } from "@/lib/meetings";
import AdminForm from "@/components/AdminForm";
import { CopyMeetingLink } from "@/components/CopyMeetingLink";
import { DownloadQrButton } from "@/components/DownloadQrButton";
import { ButtonLink } from "@/components/ui/Button";

export default async function AdminMeetingsPage() {
  const user = await requireAdmin();
  const [meetings, current] = await Promise.all([
    listMeetingsForUser(user.id),
    getSelectedMeeting(),
  ]);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">会议管理</h1>
          <p className="text-sm text-gray-500">
            当前管理会议：{current ? current.title : "无（请先选择或新建会议）"}
          </p>
        </div>
        <ButtonLink href="/admin/meetings/new" variant="primary">
          + 新建会议
        </ButtonLink>
      </div>
      {meetings.length === 0 ? (
        <p className="text-gray-500">暂无会议。</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="px-4 py-3">名称</th>
                <th className="px-4 py-3">地点</th>
                <th className="px-4 py-3">时间</th>
                <th className="px-4 py-3">会议归属</th>
                <th className="px-4 py-3">默认</th>
                <th className="px-4 py-3">报名链接</th>
                <th className="px-4 py-3">主页链接</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((m) => (
                <tr key={m.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{m.title}</td>
                  <td className="px-4 py-3 text-gray-500">{m.location || "-"}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {m.startDate} {m.endDate && `~ ${m.endDate}`}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{m.owner?.name ?? "-"}</td>
                  <td className="px-4 py-3">
                    {m.isDefault ? (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">默认</span>
                    ) : (
                      <AdminForm action={`/api/admin/meetings/${m.id}/default`} redirectTo="/admin/meetings" className="inline">
                        <button type="submit" className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 transition hover:bg-slate-50">
                          设为默认
                        </button>
                      </AdminForm>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <CopyMeetingLink meetingId={m.id} prefix="/r" label="复制报名链接" />
                      <DownloadQrButton
                        meetingId={m.id}
                        prefix="/r"
                        label="下载报名二维码"
                        fileName={`报名二维码-${m.title}`}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <CopyMeetingLink meetingId={m.id} prefix="/m" label="复制主页链接" />
                      <DownloadQrButton
                        meetingId={m.id}
                        prefix="/m"
                        label="下载主页二维码"
                        fileName={`主页二维码-${m.title}`}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminForm action="/api/admin/meetings/select" redirectTo="/admin" className="inline">
                        <input type="hidden" name="id" value={m.id} />
                        <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700">
                          进入管理
                        </button>
                      </AdminForm>
                      <ButtonLink href={`/admin/meetings/${m.id}/edit`} variant="secondary" size="xs">
                        编辑
                      </ButtonLink>
                      <AdminForm action={`/api/admin/meetings/${m.id}/delete`} redirectTo="/admin/meetings" className="inline">
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
