import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { registrationTypeSchema } from "@/lib/validation";
import { updateRegistrationType } from "@/lib/registrations";

function parse(form: FormData | null) {
  return registrationTypeSchema.safeParse({
    name: form?.get("name") ?? "",
    fee: form?.get("fee") ?? "0",
    description: form?.get("description") ?? "",
  });
}

export async function POST(req: Request, ctx: RouteContext<"/api/admin/registration-types/[id]">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const parsed = parse(form);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await updateRegistrationType(id, parsed.data);
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_IDENTITY_CODE") {
      return NextResponse.json({ ok: false, error: "该身份编号已被使用，请修改" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "更新失败" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
