import AdminShell from "@/components/AdminShell";

const MENU = [
  { href: "/admin", label: "仪表盘" },
  { href: "/admin/site", label: "站点设置" },
  { href: "/admin/notices", label: "通知管理" },
  { href: "/admin/pages", label: "内容页" },
  { href: "/admin/schedule", label: "日程管理" },
  { href: "/admin/speakers", label: "讲者管理" },
  { href: "/admin/registrations", label: "报名管理" },
  { href: "/admin/submissions", label: "论文管理" },
  { href: "/admin/hotels", label: "酒店管理" },
  { href: "/admin/bookings", label: "预订管理" },
  { href: "/admin/albums", label: "图片直播" },
  { href: "/admin/users", label: "用户管理" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell menu={MENU}>{children}</AdminShell>;
}
