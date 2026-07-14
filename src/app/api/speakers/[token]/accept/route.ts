import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { acceptSpeakerInvitation } from "@/lib/speakers-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/speakers/[token]/accept">) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });
  }
  const exists = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true } });
  if (!exists) {
    return NextResponse.json({ ok: false, error: "登录状态异常，请重新登录" }, { status: 401 });
  }
  const { token } = await ctx.params;
  try {
    await acceptSpeakerInvitation(token, user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[accept invitation] token:", token, "error:", error);
    const message = error instanceof Error ? error.message : "接受邀约失败";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
