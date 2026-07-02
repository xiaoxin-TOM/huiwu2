import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { deletePhoto } from "@/lib/albums";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/photos/[id]/delete">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    await deletePhoto(id);
  } catch {
    return NextResponse.json({ ok: false, error: "删除失败" }, { status: 400 });
  }
  return NextResponse.redirect("/admin/albums", { status: 303 });
}
