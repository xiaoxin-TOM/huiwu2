import Link from "next/link";

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
  return (
    <div className="flex min-h-screen">
      <aside className="w-52 shrink-0 border-r bg-gray-900 text-gray-100">
        <div className="p-4 font-bold">管理后台</div>
        <nav className="flex flex-col">
          {MENU.map((m) => (
            <Link key={m.href} href={m.href} className="px-4 py-2 text-sm hover:bg-gray-800">
              {m.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  );
}
