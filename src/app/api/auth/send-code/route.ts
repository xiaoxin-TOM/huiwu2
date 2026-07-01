import { NextResponse } from "next/server";
import { z } from "zod";
import { createVerificationCode } from "@/lib/verification-code";
import { sendVerificationCode } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const sendCodeSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = sendCodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  // 检查邮箱是否已注册
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ ok: false, error: "该邮箱已注册" }, { status: 409 });
  }

  try {
    const code = await createVerificationCode(email);
    await sendVerificationCode(email, code);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("发送验证码失败", e);
    return NextResponse.json({ ok: false, error: "验证码发送失败，请稍后重试" }, { status: 500 });
  }
}
