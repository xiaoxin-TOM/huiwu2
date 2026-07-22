import { requireCurrentMeeting, getMeetingById } from "@/lib/meetings";
import { listMeetingStaff } from "@/lib/meeting-staff";
import MeetingStaffAuthorizeForm from "@/components/MeetingStaffAuthorizeForm";
import AdminForm from "@/components/AdminForm";

export default async function AdminUsersPage() {
  const meeting = await requireCurrentMeeting();
  const [full, staff] = await Promise.all([getMeetingById(meeting.id), listMeetingStaff(meeting.id)]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">会议授权</h1>
        <p className="mt-1 text-sm text-gray-500">当前会议：{meeting.title}</p>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold">会议归属</h2>
        <p className="text-sm text-gray-500">
          {full?.owner ? `${full.owner.name}（${full.owner.email}）` : "无归属（历史遗留会议，所有管理员可见）"}
        </p>
      </div>

      <div className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">授权用户管理本会议</h2>
          <p className="mt-1 text-sm text-gray-500">
            通过邮箱授权其他已注册用户管理本会议，授权后对方将获得本会议的全部管理权限（若对方当前不是管理员，将自动升级为管理员）。
          </p>
        </div>
        <MeetingStaffAuthorizeForm meetingTitle={meeting.title} />

        {staff.length === 0 ? (
          <p className="text-sm text-gray-500">尚未授权任何用户。</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="px-4 py-3">姓名</th>
                  <th className="px-4 py-3">邮箱</th>
                  <th className="px-4 py-3">授权时间</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.userId} className="border-b">
                    <td className="px-4 py-3">{s.user.name}</td>
                    <td className="px-4 py-3">{s.user.email}</td>
                    <td className="px-4 py-3 text-gray-500">{s.grantedAt.toLocaleString("zh-CN")}</td>
                    <td className="px-4 py-3">
                      <AdminForm action={`/api/admin/meeting-staff/${s.userId}/revoke`} redirectTo="/admin/users">
                        <button
                          type="submit"
                          className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
                        >
                          撤销授权
                        </button>
                      </AdminForm>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
