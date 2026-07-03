import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/lib/siteconfig";
import AdminSiteForm from "@/components/AdminSiteForm";
import {
  UsersIcon,
  ClipboardListIcon,
  BookmarkIcon,
  ImageIcon,
} from "@/components/icons";

const STATS = [
  { label: "用户", field: "users", icon: UsersIcon, color: "text-sky-600" },
  { label: "报名", field: "regs", icon: ClipboardListIcon, color: "text-amber-500" },
  { label: "预订", field: "bookings", icon: BookmarkIcon, color: "text-rose-500" },
  { label: "相册", field: "albums", icon: ImageIcon, color: "text-indigo-500" },
] as const;

export default async function AdminDashboard() {
  const [users, regs, bookings, albums, cfg] = await Promise.all([
    prisma.user.count(),
    prisma.registration.count(),
    prisma.hotelBooking.count(),
    prisma.album.count(),
    getSiteConfig(),
  ]);

  const values: Record<(typeof STATS)[number]["field"], number> = {
    users,
    regs,
    bookings,
    albums,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-admin-text">基础信息</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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

      <div className="max-w-2xl space-y-4 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">站点设置</h2>
        <AdminSiteForm defaultValues={cfg ?? {}} />
      </div>
    </div>
  );
}
