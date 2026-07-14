import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { adminUserUpdateSchema } from "@/lib/validation";
import { updateUser } from "@/lib/users-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/users/[id]">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  if (id === session?.user?.id) {
    return NextResponse.json({ ok: false, error: "不能修改自己的账号" }, { status: 400 });
  }
  const form = await req.formData().catch(() => null);
  const parsed = adminUserUpdateSchema.safeParse({
    name: form?.get("name") ?? "",
    email: form?.get("email") ?? "",
    password: form?.get("password") ?? "",
    role: form?.get("role") ?? "USER",
    isActive: form?.get("isActive") === "on",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }
  try {
    await updateUser(id, parsed.data);
  } catch (e) {
    const message = e instanceof Error && e.message === "EMAIL_EXISTS" ? "该邮箱已被使用" : "更新失败";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
