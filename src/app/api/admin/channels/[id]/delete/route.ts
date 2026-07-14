import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { deleteChannel } from "@/lib/channels-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/channels/[id]/delete">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    await deleteChannel(id);
  } catch {
    return NextResponse.json({ ok: false, error: "删除失败" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
