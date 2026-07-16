import { prisma } from "@/lib/prisma";
import { requireSelectedMeeting } from "@/lib/meetings";
import { redirect } from "next/navigation";
import AdminSiteForm from "@/components/AdminSiteForm";
import { ButtonLink } from "@/components/ui/Button";
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
  const meeting = await requireSelectedMeeting().catch(() => null);
  if (!meeting) redirect("/admin/meetings");
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
        <ButtonLink href="/admin/meetings" variant="primary" size="sm">
          切换会议
        </ButtonLink>
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

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">站点设置</h2>
        <div className="mt-4">
          <AdminSiteForm defaultValues={{
            confName: meeting.title,
            confDate: meeting.confDate,
            confLocation: meeting.location,
            logoUrl: meeting.logoUrl,
            heroImageUrl: meeting.heroImageUrl,
            liveUrl: meeting.liveUrl,
            welcomeHtml: meeting.welcomeHtml,
            footerHtml: meeting.footerHtml,
            venueAddress: meeting.venueAddress,
            venueLng: meeting.venueLng,
            venueLat: meeting.venueLat,
          }} />
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">数据导出</h3>
          <div className="grid grid-cols-2 gap-3">
            <ButtonLink href="/api/admin/registrations/export" download variant="secondary" size="sm" className="flex items-center justify-start gap-2 p-3">
              <DownloadIcon className="h-4 w-4" /> 报名名单 CSV
            </ButtonLink>
            <ButtonLink href="/api/admin/bookings/export" download variant="secondary" size="sm" className="flex items-center justify-start gap-2 p-3">
              <DownloadIcon className="h-4 w-4" /> 酒店预订 CSV
            </ButtonLink>
            <ButtonLink href="/api/admin/checkins/export" download variant="secondary" size="sm" className="flex items-center justify-start gap-2 p-3">
              <DownloadIcon className="h-4 w-4" /> 签到记录 CSV
            </ButtonLink>
            <ButtonLink href="/api/admin/channels/export" download variant="secondary" size="sm" className="flex items-center justify-start gap-2 p-3">
              <DownloadIcon className="h-4 w-4" /> 渠道统计 CSV
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
