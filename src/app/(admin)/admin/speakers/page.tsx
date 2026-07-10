import { getAllSpeakers } from "@/lib/speakers";
import { getCurrentMeeting } from "@/lib/meetings";
import AdminForm from "@/components/AdminForm";
import { ButtonLink } from "@/components/ui/Button";
import SpeakerInviteButton from "@/components/SpeakerInviteButton";

export default async function AdminSpeakersPage() {
  const meeting = await getCurrentMeeting();
  if (!meeting) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">讲者管理</h1>
        <p className="text-red-600">未选择当前会议，请先到“会议管理”选择或创建一个会议。</p>
      </div>
    );
  }
  const speakers = await getAllSpeakers(meeting.id);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">讲者管理</h1>

      <AdminForm action="/api/admin/speakers" redirectTo="/admin/speakers" className="space-y-2 rounded border p-4">
        <h2 className="font-medium">新建讲者</h2>
        <input name="name" required placeholder="姓名" className="w-full rounded border px-3 py-2" />
        <input name="title" placeholder="职称" className="w-full rounded border px-3 py-2" />
        <input name="organization" placeholder="单位" className="w-full rounded border px-3 py-2" />
        <input name="photoUrl" placeholder="照片地址(可选)" className="w-full rounded border px-3 py-2" />
        <textarea name="bio" rows={3} placeholder="简介(HTML)" className="w-full rounded border px-3 py-2 font-mono text-sm" />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" name="isModerator" /> 主持人
        </label>
        <button type="submit" className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800">
          新建
        </button>
      </AdminForm>

      {speakers.length === 0 ? (
        <p className="text-gray-500">暂无讲者。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">姓名</th>
                <th>职称</th>
                <th>单位</th>
                <th>角色</th>
                <th>认证状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {speakers.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="py-2">{s.name}</td>
                  <td>{s.title}</td>
                  <td>{s.organization}</td>
                  <td>{s.isModerator ? "主持人" : "讲者"}</td>
                  <td>
                    {s.confirmed ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                        已认证
                      </span>
                    ) : s.invitedAt ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                        待确认
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        未邀约
                      </span>
                    )}
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <ButtonLink href={`/admin/speakers/${s.id}`} variant="secondary" size="xs">
                        编辑
                      </ButtonLink>
                      <SpeakerInviteButton speakerId={s.id} />
                      <AdminForm action={`/api/admin/speakers/${s.id}/delete`} redirectTo="/admin/speakers">
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
