import Link from "next/link";
import { auth } from "@/lib/auth";
import MobileNav from "@/components/MobileNav";

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
  const accountHref = session?.user ? "/me" : "/login";
  const accountLabel = session?.user ? "个人中心" : "登录 / 注册";

  return (
    <header className="relative border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-x-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-sky-700">会务系统</Link>

        {/* 桌面导航 */}
        <nav className="hidden flex-wrap gap-x-4 gap-y-1 text-sm md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-gray-700 hover:text-sky-700">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden text-sm md:block">
          <Link href={accountHref} className="text-sky-700">{accountLabel}</Link>
        </div>

        {/* 移动端汉堡 */}
        <div className="ml-auto md:hidden">
          <MobileNav items={NAV} accountHref={accountHref} accountLabel={accountLabel} />
        </div>
      </div>
    </header>
  );
}
