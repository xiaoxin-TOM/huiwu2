import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { deleteUser } from "@/lib/users-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/users/[id]/delete">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  if (id === session?.user?.id) {
    return NextResponse.json({ ok: false, error: "不能删除自己" }, { status: 400 });
  }
  try {
    await deleteUser(id);
  } catch {
    return NextResponse.json({ ok: false, error: "删除失败" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
