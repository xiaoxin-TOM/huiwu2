import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { deleteOwnTemplate } from "@/lib/meeting-templates-admin";

export async function DELETE(req: Request, ctx: RouteContext<"/api/admin/meeting-templates/[id]">) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!isAdmin(session?.user?.role) || !userId) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  // 只能删自己另存的模板；不存在与非本人一律按 404，不泄漏是否存在
  const ok = await deleteOwnTemplate(id, userId);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "模板不存在" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
