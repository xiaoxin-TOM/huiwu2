import Link from "next/link";
import { getCheckinStats, listRecentCheckins } from "@/lib/registrations";
import { requireCurrentMeeting } from "@/lib/meetings";
import { ScanIcon, UserCheckIcon } from "@/components/icons";

export default async function AdminCheckinPage() {
  const meeting = await requireCurrentMeeting();
  const [stats, recent] = await Promise.all([getCheckinStats(meeting.id), listRecentCheckins(meeting.id, 10)]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">签到管理</h1>
        <p className="text-sm text-gray-500">当前会议：{meeting.title}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">报名总人数</div>
          <div className="text-3xl font-bold text-sky-600">{stats.total}</div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">已签到</div>
          <div className="text-3xl font-bold text-emerald-600">{stats.checkedIn}</div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">未签到</div>
          <div className="text-3xl font-bold text-amber-500">{stats.unchecked}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/admin/checkin/scan"
          className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
            <ScanIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="font-semibold">扫码签到</div>
            <div className="text-sm text-gray-500">使用摄像头扫描二维码完成签到</div>
          </div>
        </Link>
        <Link
          href="/admin/checkin/manual"
          className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <UserCheckIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="font-semibold">手动签到</div>
            <div className="text-sm text-gray-500">搜索姓名、手机或单位后手动签到</div>
          </div>
        </Link>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">最近签到</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-500">暂无签到记录。</p>
        ) : (
          <ul className="divide-y">
            {recent.map((log) => (
              <li key={log.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <span className="font-medium">{log.registration.fullName}</span>
                  <span className="ml-2 text-gray-400">{log.registration.type?.name}</span>
                </div>
                <div className="text-gray-400">
                  {log.method === "MANUAL" ? "手动" : log.method === "SELF" ? "自助" : "扫码"}
                  <span className="mx-1">·</span>
                  {log.checkedAt.toLocaleString("zh-CN")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
