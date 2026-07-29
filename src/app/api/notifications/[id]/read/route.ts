import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markNotificationRead } from "@/lib/notifications";

export async function POST(req: Request, ctx: RouteContext<"/api/notifications/[id]/read">) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });
  }
  const { id } = await ctx.params;
  // markNotificationRead 内部带 userId 条件，越权标记会命中 0 行
  const result = await markNotificationRead(id, userId);
  return NextResponse.json({ ok: true, updated: result.count });
}
