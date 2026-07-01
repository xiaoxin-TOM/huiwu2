import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation";
import { createUser } from "@/lib/users";
import { verifyCode } from "@/lib/verification-code";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 }
    );
  }

  const { code, name, email, password, phone, organization } = parsed.data;

  const codeValid = await verifyCode(email, code);
  if (!codeValid) {
    return NextResponse.json({ ok: false, error: "验证码错误或已过期" }, { status: 400 });
  }

  try {
    const { id } = await createUser({ name, email, password, phone, organization });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    if (e instanceof Error && e.message === "EMAIL_TAKEN") {
      return NextResponse.json({ ok: false, error: "该邮箱已注册" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "注册失败" }, { status: 500 });
  }
}
