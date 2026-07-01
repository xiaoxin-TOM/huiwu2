import Link from "next/link";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { ShieldIcon, UserIcon } from "@/components/icons";

export default async function SiteHeader() {
  const session = await auth();
  const admin = session?.user?.role && isAdmin(session.user.role);

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="rounded-md bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-lg font-bold text-transparent"
        >
          会务系统
        </Link>

        <div className="flex items-center gap-2 text-sm">
          {admin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1.5 font-medium text-white transition hover:bg-slate-700"
            >
              <ShieldIcon className="h-3.5 w-3.5" />
              管理后台
            </Link>
          )}
          {session?.user ? (
            <Link
              href="/me"
              className="flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 font-medium text-sky-700 transition hover:bg-sky-100"
            >
              <UserIcon className="h-4 w-4" />
              个人中心
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-sky-600 px-4 py-1.5 font-medium text-white transition hover:bg-sky-700"
            >
              登录 / 注册
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
