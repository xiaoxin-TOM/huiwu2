import { NextResponse } from "next/server";
import { getReportLinkByToken, reportLinkState, checkReportLinkPassword } from "@/lib/report-links";
import { reportLinkCookieName, signReportLinkCookie } from "@/lib/report-link-token";

/** 汇报链接的密码闸口。通过后下发 HMAC cookie，不落任何会话存储。 */
export async function POST(req: Request, ctx: RouteContext<"/api/report-links/[token]/auth">) {
  const { token } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const password = form?.get("password")?.toString() ?? "";

  const link = await getReportLinkByToken(token);
  // 不区分"链接不存在"和"密码错误"，避免拿 token 枚举
  if (!link || !password) {
    return NextResponse.json({ ok: false, error: "链接或密码不正确" }, { status: 401 });
  }

  const state = reportLinkState(link);
  if (state === "INACTIVE") {
    return NextResponse.json({ ok: false, error: "该汇报链接已停用" }, { status: 403 });
  }
  if (state === "EXPIRED") {
    return NextResponse.json({ ok: false, error: "该汇报链接已过期" }, { status: 403 });
  }

  if (!(await checkReportLinkPassword(link, password))) {
    return NextResponse.json({ ok: false, error: "链接或密码不正确" }, { status: 401 });
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error("[report link auth] AUTH_SECRET 未配置");
    return NextResponse.json({ ok: false, error: "服务端未正确配置" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(reportLinkCookieName(link.token), signReportLinkCookie(link.token, link.passwordHash, secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // 链接自身有失效时间时，cookie 不该活得比它更久
    expires: link.expiresAt ?? undefined,
    maxAge: link.expiresAt ? undefined : 60 * 60 * 12,
  });
  return res;
}
