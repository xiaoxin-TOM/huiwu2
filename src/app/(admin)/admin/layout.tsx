import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/access";
import { getSelectedMeeting } from "@/lib/meetings";
import {
  HomeIcon,
  BellIcon,
  FileTextIcon,
  CalendarIcon,
  UsersIcon,
  ClipboardListIcon,
  HotelIcon,
  BookmarkIcon,
  ImageIcon,
  UserCogIcon,
  LayersIcon,
  ArrowLeftIcon,
  ScanIcon,
  StarIcon,
  LinkIcon,
  FileEditIcon,
  VideoIcon,
} from "@/components/icons";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import AdminShell from "@/components/AdminShell";
import AdminNavItem from "@/components/AdminNavItem";
import { ButtonLink } from "@/components/ui/Button";

const MENU = [
  { href: "/admin/meetings", label: "会议管理", icon: LayersIcon },
  { href: "/admin", label: "基础信息", icon: HomeIcon },
  { href: "/admin/home-grid", label: "首页宫格", icon: StarIcon },
  { href: "/admin/live", label: "直播管理", icon: VideoIcon },
  { href: "/admin/notices", label: "通知管理", icon: BellIcon },
  { href: "/admin/pages", label: "内容页", icon: FileTextIcon },
  { href: "/admin/schedule", label: "日程管理", icon: CalendarIcon },
  { href: "/admin/speakers", label: "讲者管理", icon: UsersIcon },
  { href: "/admin/registrations", label: "报名管理", icon: ClipboardListIcon },
  { href: "/admin/hotels", label: "酒店管理", icon: HotelIcon },
  { href: "/admin/bookings", label: "预订管理", icon: BookmarkIcon },
  { href: "/admin/submissions", label: "投稿审核", icon: FileEditIcon },
  { href: "/admin/albums", label: "直播图片", icon: ImageIcon },
  { href: "/admin/guests", label: "嘉宾管理", icon: StarIcon },
  { href: "/admin/receptions", label: "接待管理", icon: UsersIcon },
  { href: "/admin/channels", label: "渠道推广", icon: LinkIcon },
  { href: "/admin/badge-template", label: "胸卡模板", icon: FileTextIcon },
  { href: "/admin/users", label: "用户管理", icon: UserCogIcon },
  { href: "/admin/checkin", label: "签到管理", icon: ScanIcon },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.role || !isAdmin(session.user.role)) {
    redirect("/login?callbackUrl=/admin/meetings");
  }

  const [selected, headerStore] = await Promise.all([getSelectedMeeting(), headers()]);
  const pathname = headerStore.get("x-pathname") ?? "/admin";

  // 未选择会议时，只允许停留在会议管理页
  if (!selected && pathname !== "/admin/meetings") {
    redirect("/admin/meetings");
  }

  const sidebar = (
    <>
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
          <LayersIcon className="h-5 w-5" />
        </div>
        <div className="font-semibold tracking-wide">会务管理系统</div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {MENU.map((m) => {
            const disabled = !selected && m.href !== "/admin/meetings";
            return (
              <li key={m.href}>
                <AdminNavItem href={m.href} label={m.label} icon={m.icon} disabled={disabled} />
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3">
        <AdminLogoutButton />
      </div>
    </>
  );

  return (
    <AdminShell sidebar={sidebar}>
      <div className="mb-6 flex justify-end">
        <ButtonLink href="/" variant="secondary" size="sm">
          <ArrowLeftIcon className="h-4 w-4" />
          返回首页
        </ButtonLink>
      </div>
      {children}
    </AdminShell>
  );
}
