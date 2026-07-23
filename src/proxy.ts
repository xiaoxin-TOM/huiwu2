import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/access";

const { auth } = NextAuth(authConfig);

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

type AuthRequest = Parameters<Parameters<typeof auth>[0]>[0];

function withPathnameHeader(req: AuthRequest, headers: Headers) {
  headers.set("x-pathname", req.nextUrl.pathname);
  return headers;
}

function rewriteWithMeeting(
  req: Parameters<Parameters<typeof auth>[0]>[0],
  meetingId: string,
  targetPathname: string,
) {
  const url = req.nextUrl.clone();
  url.pathname = targetPathname;
  url.searchParams.set("m", meetingId);
  const requestHeaders = withPathnameHeader(req, new Headers(req.headers));
  requestHeaders.set("x-meeting-id", meetingId);
  const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  response.cookies.set("public_meeting_id", meetingId, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  return response;
}

function redirectToLogin(req: AuthRequest) {
  const login = new URL("/login", req.nextUrl.origin);
  login.searchParams.set("callbackUrl", `${req.nextUrl.pathname}${req.nextUrl.search}`);
  return NextResponse.redirect(login);
}

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role as string | undefined;

  const rMatch = pathname.match(/^\/r\/([^/]+)$/);
  if (rMatch) {
    if (!role) {
      return redirectToLogin(req);
    }
    return rewriteWithMeeting(req, rMatch[1], "/register-conf");
  }

  const mRootMatch = pathname.match(/^\/m\/([^/]+)$/);
  if (mRootMatch) {
    // 是否要求登录/实名由 guardPublicAccess 在页面内按会议的 requireRealName 配置判断
    return rewriteWithMeeting(req, mRootMatch[1], "/");
  }

  const mMatch = pathname.match(/^\/m\/([^/]+)(\/.*)$/);
  if (mMatch) {
    return rewriteWithMeeting(req, mMatch[1], mMatch[2]);
  }

  if (!isAdmin(role)) {
    return redirectToLogin(req);
  }
  const requestHeaders = withPathnameHeader(req, new Headers(req.headers));
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: ["/admin/:path*", "/r/:path*", "/m/:path*"],
};
