import { listSessionsAdmin } from "@/lib/schedule-admin";
import { getAllSpeakers } from "@/lib/speakers";
import { getCurrentMeeting } from "@/lib/meetings";
import { SessionSpeakerFields } from "@/components/SessionSpeakerFields";
import AdminForm from "@/components/AdminForm";
import ScheduleImageModeEditor from "@/components/ScheduleImageModeEditor";
import { ButtonLink } from "@/components/ui/Button";

export default async function AdminSchedulePage() {
  const meeting = await getCurrentMeeting();
  if (!meeting) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">日程管理</h1>
        <p className="text-red-600">未选择当前会议，请先到“会议管理”选择或创建一个会议。</p>
      </div>
    );
  }
  const [sessions, speakers] = await Promise.all([
    listSessionsAdmin(meeting.id),
    getAllSpeakers(meeting.id),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">日程管理</h1>

      <ScheduleImageModeEditor defaultMode={meeting.scheduleMode} defaultImageUrl={meeting.scheduleImageUrl ?? ""} />

      <AdminForm action="/api/admin/sessions" redirectTo="/admin/schedule" className="grid grid-cols-2 gap-2 rounded border p-4 sm:grid-cols-3">
        <input name="day" type="date" required className="rounded border px-2 py-1.5 text-sm" />
        <input name="startTime" placeholder="开始 09:00" required className="rounded border px-2 py-1.5 text-sm" />
        <input name="endTime" placeholder="结束 10:00" required className="rounded border px-2 py-1.5 text-sm" />
        <input name="room" placeholder="会场" className="rounded border px-2 py-1.5 text-sm" />
        <input name="title" placeholder="场次标题" required className="rounded border px-2 py-1.5 text-sm sm:col-span-3" />
        <SessionSpeakerFields speakers={speakers} />
        <button type="submit" className="rounded-lg bg-sky-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-sky-800">
          新建场次
        </button>
      </AdminForm>

      {sessions.length === 0 ? (
        <p className="text-gray-500">暂无场次。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">日期</th><th>时间</th><th>会场</th><th>标题</th><th>讲者</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="py-2">{s.day}</td>
                  <td>{s.startTime}–{s.endTime}</td>
                  <td>{s.room}</td>
                  <td>{s.title}</td>
                  <td>{(s.speakers ?? []).map((x) => x.speaker?.name ?? "未知讲者").join("、")}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <ButtonLink href={`/admin/schedule/${s.id}`} variant="secondary" size="xs">
                        编辑
                      </ButtonLink>
                      <AdminForm action={`/api/admin/sessions/${s.id}/delete`} redirectTo="/admin/schedule">
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
