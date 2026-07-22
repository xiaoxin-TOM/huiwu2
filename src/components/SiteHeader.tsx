import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { getPublicMeetingForRequest } from "@/lib/meetings";
import { prisma } from "@/lib/prisma";
import { getPublicConfig, meetingHref } from "@/lib/public";
import { ShieldIcon, UserIcon } from "@/components/icons";

async function getHeaderMeeting() {
  return getPublicMeetingForRequest();
}

export default async function SiteHeader() {
  const session = await auth();
  const admin = session?.user?.role && isAdmin(session.user.role);
  const meeting = await getHeaderMeeting();
  const siteConfig = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  const cfg = meeting && siteConfig ? getPublicConfig(meeting, siteConfig) : null;

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3">
        <Link href={meeting ? meetingHref(meeting.id, "/") : "/register-conf"} className="flex shrink-0 items-center gap-2 rounded-md sm:gap-3">
          <Image
            src={cfg?.logoUrl || "/imgs/hwttupian.png"}
            alt="会务系统"
            width={600}
            height={602}
            className="h-8 w-auto object-contain sm:h-10"
            priority
          />
          {cfg?.confName && (
            <span className="hidden max-w-[200px] truncate text-sm font-semibold text-slate-800 sm:inline">
              {cfg.confName}
            </span>
          )}
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 text-xs sm:gap-2 sm:text-sm">
          {admin && (
            <Link
              href="/admin"
              className="flex items-center gap-1 whitespace-nowrap rounded-full bg-slate-800 px-2 py-1 font-medium text-white transition hover:bg-slate-700 sm:gap-1.5 sm:px-3 sm:py-1.5"
            >
              <ShieldIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              管理后台
            </Link>
          )}
          {session?.user ? (
            <Link
              href={meeting ? `/m/${meeting.id}/me` : "/me"}
              className="flex items-center gap-1 whitespace-nowrap rounded-full bg-sky-50 px-2 py-1 font-medium text-sky-700 transition hover:bg-sky-100 sm:gap-1.5 sm:px-3 sm:py-1.5"
            >
              <UserIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              个人中心
            </Link>
          ) : (
            <Link
              href="/login"
              className="whitespace-nowrap rounded-full bg-sky-600 px-3 py-1 font-medium text-white transition hover:bg-sky-700 sm:px-4 sm:py-1.5"
            >
              登录 / 注册
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
