import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { registrationTypeSchema } from "@/lib/validation";
import { createRegistrationType } from "@/lib/registrations";

function parse(form: FormData | null) {
  return registrationTypeSchema.safeParse({
    name: form?.get("name") ?? "",
    fee: form?.get("fee") ?? "0",
    description: form?.get("description") ?? "",
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const form = await req.formData().catch(() => null);
  const parsed = parse(form);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    const created = await createRegistrationType(parsed.data);
    return NextResponse.json({ ok: true, type: created });
  } catch {
    return NextResponse.json({ ok: false, error: "创建失败" }, { status: 500 });
  }
}
