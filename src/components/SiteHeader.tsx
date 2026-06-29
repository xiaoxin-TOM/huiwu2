import Link from "next/link";
import { auth } from "@/lib/auth";

const NAV = [
  { href: "/", label: "首页" },
  { href: "/notices", label: "会议通知" },
  { href: "/register-conf", label: "注册报名" },
  { href: "/submissions", label: "论文提交" },
  { href: "/schedule/brief", label: "简明日程" },
  { href: "/schedule", label: "详细日程" },
  { href: "/speakers", label: "讲者查询" },
  { href: "/venue", label: "会场交通" },
  { href: "/hotels", label: "酒店预订" },
  { href: "/live", label: "直播" },
  { href: "/photos", label: "图片直播" },
  { href: "/contact", label: "联系方式" },
];

export default async function SiteHeader() {
  const session = await auth();
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="font-bold text-lg text-sky-700">会务系统</Link>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-gray-700 hover:text-sky-700">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto text-sm">
          {session?.user ? (
            // TODO Phase 2: 个人中心 /me
            <Link href="/" className="text-sky-700">个人中心</Link>
          ) : (
            <Link href="/login" className="text-sky-700">登录 / 注册</Link>
          )}
        </div>
      </div>
    </header>
  );
}
