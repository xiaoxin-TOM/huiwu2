import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { adminUserCreateSchema } from "@/lib/validation";
import { createUser } from "@/lib/users-admin";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const form = await req.formData().catch(() => null);
  const parsed = adminUserCreateSchema.safeParse({
    name: form?.get("name") ?? "",
    email: form?.get("email") ?? "",
    password: form?.get("password") ?? "",
    role: form?.get("role") ?? "USER",
    isActive: form?.get("isActive") ?? "on",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }
  try {
    await createUser(parsed.data);
  } catch (e) {
    const message = e instanceof Error && e.message === "EMAIL_EXISTS" ? "该邮箱已被使用" : "创建失败";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
