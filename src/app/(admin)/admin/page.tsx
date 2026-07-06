import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCurrentMeeting } from "@/lib/meetings";
import AdminSiteForm from "@/components/AdminSiteForm";
import {
  UsersIcon,
  ClipboardListIcon,
  BookmarkIcon,

  FileEditIcon,
  StarIcon,
  LinkIcon,
  DownloadIcon,
} from "@/components/icons";

const STATS = [
  { label: "报名", field: "regs", icon: ClipboardListIcon, color: "text-amber-500" },
  { label: "已签到", field: "checkedIn", icon: UsersIcon, color: "text-emerald-600" },
  { label: "预订", field: "bookings", icon: BookmarkIcon, color: "text-rose-500" },
  { label: "投稿", field: "submissions", icon: FileEditIcon, color: "text-indigo-500" },
  { label: "嘉宾", field: "guests", icon: StarIcon, color: "text-purple-500" },
  { label: "渠道", field: "channels", icon: LinkIcon, color: "text-sky-600" },
] as const;

export default async function AdminDashboard() {
  const meeting = await requireCurrentMeeting();
  const [regs, checkedIn, bookings, submissions, guests, channels] = await Promise.all([
    prisma.registration.count({ where: { meetingId: meeting.id } }),
    prisma.registration.count({ where: { meetingId: meeting.id, checkedIn: true } }),
    prisma.hotelBooking.count({ where: { meetingId: meeting.id } }),
    prisma.submission.count({ where: { meetingId: meeting.id } }),
    prisma.guest.count({ where: { meetingId: meeting.id } }),
    prisma.channel.count({ where: { meetingId: meeting.id } }),
  ]);

  const values: Record<(typeof STATS)[number]["field"], number> = {
    regs,
    checkedIn,
    bookings,
    submissions,
    guests,
    channels,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-admin-text">基础信息</h1>
          <p className="text-sm text-admin-muted">当前会议：{meeting.title}</p>
        </div>
        <Link
          href="/admin/meetings"
          className="rounded-lg bg-sky-700 px-3 py-1.5 text-sm text-white hover:bg-sky-800"
        >
          切换会议
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {STATS.map(({ label, field, icon: Icon, color }) => (
          <div
            key={field}
            className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-admin-muted">{label}</span>
              <div className="rounded-md bg-slate-100 p-1.5 text-slate-500">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className={`text-3xl font-bold ${color}`}>{values[field]}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="max-w-2xl space-y-4 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">站点设置</h2>
          <AdminSiteForm defaultValues={{
            confName: meeting.title,
            confDate: meeting.confDate,
            confLocation: meeting.location,
            logoUrl: meeting.logoUrl,
            liveUrl: meeting.liveUrl,
            welcomeHtml: meeting.welcomeHtml,
            footerHtml: meeting.footerHtml,
          }} />
        </div>

        <div className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">数据导出</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link href="/api/admin/registrations/export" download className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50">
              <DownloadIcon className="h-4 w-4" /> 报名名单 CSV
            </Link>
            <Link href="/api/admin/bookings/export" download className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50">
              <DownloadIcon className="h-4 w-4" /> 酒店预订 CSV
            </Link>
            <Link href="/api/admin/checkins/export" download className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50">
              <DownloadIcon className="h-4 w-4" /> 签到记录 CSV
            </Link>
            <Link href="/api/admin/channels/export" download className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50">
              <DownloadIcon className="h-4 w-4" /> 渠道统计 CSV
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
