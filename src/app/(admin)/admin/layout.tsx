import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/access";
import {
  HomeIcon,
  SettingsIcon,
  BellIcon,
  FileTextIcon,
  CalendarIcon,
  UsersIcon,
  ClipboardListIcon,
  FileEditIcon,
  HotelIcon,
  BookmarkIcon,
  ImageIcon,
  UserCogIcon,
  LayersIcon,
  ArrowLeftIcon,
} from "@/components/icons";
import AdminLogoutButton from "@/components/AdminLogoutButton";

const MENU = [
  { href: "/admin", label: "仪表盘", icon: HomeIcon },
  { href: "/admin/site", label: "站点设置", icon: SettingsIcon },
  { href: "/admin/notices", label: "通知管理", icon: BellIcon },
  { href: "/admin/pages", label: "内容页", icon: FileTextIcon },
  { href: "/admin/schedule", label: "日程管理", icon: CalendarIcon },
  { href: "/admin/speakers", label: "讲者管理", icon: UsersIcon },
  { href: "/admin/registrations", label: "报名管理", icon: ClipboardListIcon },
  { href: "/admin/submissions", label: "论文管理", icon: FileEditIcon },
  { href: "/admin/hotels", label: "酒店管理", icon: HotelIcon },
  { href: "/admin/bookings", label: "预订管理", icon: BookmarkIcon },
  { href: "/admin/albums", label: "图片直播", icon: ImageIcon },
  { href: "/admin/users", label: "用户管理", icon: UserCogIcon },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.role || !isAdmin(session.user.role)) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-admin-bg">
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col bg-gradient-to-b from-admin-sidebar to-admin-sidebar-dark text-white shadow-xl">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
            <LayersIcon className="h-5 w-5" />
          </div>
          <div className="font-semibold tracking-wide">会务管理系统</div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {MENU.map((m) => {
              const Icon = m.icon;
              return (
                <li key={m.href}>
                  <Link
                    href={m.href}
                    className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/90 transition hover:bg-white/15 hover:text-white"
                  >
                    <Icon className="h-5 w-5 opacity-80 group-hover:opacity-100" />
                    <span>{m.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-white/10 p-3">
          <AdminLogoutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden p-6 lg:p-8">
        <div className="mb-6 flex justify-end">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-admin-text shadow-sm transition hover:bg-admin-bg"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            返回首页
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
}
