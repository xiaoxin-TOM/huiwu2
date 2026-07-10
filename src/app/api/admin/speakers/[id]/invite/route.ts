import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { ensureSpeakerToken } from "@/lib/speakers-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/speakers/[id]/invite">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    const speaker = await ensureSpeakerToken(id);
    const origin = process.env.AUTH_URL || new URL(req.url).origin;
    const link = `${origin}/s/${speaker.token}`;
    return NextResponse.json({ ok: true, token: speaker.token, link });
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成邀约链接失败";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
