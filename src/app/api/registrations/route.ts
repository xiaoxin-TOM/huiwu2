import { NextResponse } from "next/server";
import { registrationSchema } from "@/lib/validation";
import { currentUser } from "@/lib/session";
import { createRegistration } from "@/lib/registrations";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }
  try {
    const reg = await createRegistration(user.id, parsed.data);
    return NextResponse.json({ ok: true, id: reg.id });
  } catch (e) {
    if (e instanceof Error && e.message === "ALREADY_REGISTERED") {
      return NextResponse.json({ ok: false, error: "您已报名,不能重复提交" }, { status: 409 });
    }
    if (e instanceof Error && e.message === "TYPE_NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "参会类型不存在" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "报名失败" }, { status: 500 });
  }
}
