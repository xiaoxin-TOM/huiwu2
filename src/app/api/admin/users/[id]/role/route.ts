import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { roleSchema } from "@/lib/validation";
import { setUserRole } from "@/lib/users-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/users/[id]/role">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  // 防自锁:不允许修改自己的角色
  if (id === session?.user?.id) {
    return NextResponse.json({ ok: false, error: "不能修改自己的角色" }, { status: 400 });
  }
  const form = await req.formData().catch(() => null);
  const parsed = roleSchema.safeParse({ role: form?.get("role") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });
  }
  try {
    await setUserRole(id, parsed.data.role);
  } catch {
    return NextResponse.json({ ok: false, error: "操作失败" }, { status: 400 });
  }
  return NextResponse.redirect("/admin/users", { status: 303 });
}
