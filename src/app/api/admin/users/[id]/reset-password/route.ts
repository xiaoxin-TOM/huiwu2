import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { resetUserPassword } from "@/lib/users-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/users/[id]/reset-password">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  if (id === session?.user?.id) {
    return NextResponse.json({ ok: false, error: "不能重置自己的密码" }, { status: 400 });
  }
  try {
    await resetUserPassword(id);
  } catch {
    return NextResponse.json({ ok: false, error: "重置失败" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
