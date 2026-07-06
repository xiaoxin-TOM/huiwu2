import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/access";

const { auth } = NextAuth(authConfig);

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function rewriteWithMeeting(
  req: Parameters<Parameters<typeof auth>[0]>[0],
  meetingId: string,
  targetPathname: string,
) {
  const url = req.nextUrl.clone();
  url.pathname = targetPathname;
  url.searchParams.set("m", meetingId);
  const response = NextResponse.rewrite(url);
  response.cookies.set("public_meeting_id", meetingId, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  return response;
}

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  const rMatch = pathname.match(/^\/r\/([^/]+)$/);
  if (rMatch) {
    return rewriteWithMeeting(req, rMatch[1], "/register-conf");
  }

  const mRootMatch = pathname.match(/^\/m\/([^/]+)$/);
  if (mRootMatch) {
    return rewriteWithMeeting(req, mRootMatch[1], "/");
  }

  const mMatch = pathname.match(/^\/m\/([^/]+)(\/.*)$/);
  if (mMatch) {
    return rewriteWithMeeting(req, mMatch[1], mMatch[2]);
  }

  const role = req.auth?.user?.role as string | undefined;
  if (!isAdmin(role)) {
    const url = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/r/:path*", "/m/:path*"],
};
