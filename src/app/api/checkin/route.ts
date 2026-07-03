import { NextResponse } from "next/server";
import { findRegistrationByToken, recordCheckin } from "@/lib/registrations";

export async function POST(req: Request) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });
  }
  const token = body.token?.trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "缺少签到凭证" }, { status: 400 });
  }

  const reg = await findRegistrationByToken(token);
  if (!reg) {
    return NextResponse.json({ ok: false, error: "未识别的签到凭证" }, { status: 404 });
  }

  const result = await recordCheckin(reg.id, { method: "SELF" });
  return NextResponse.json({
    ok: true,
    first: result.first,
    registration: {
      id: reg.id,
      fullName: reg.fullName,
      organization: reg.organization,
      phone: reg.phone,
      type: reg.type?.name,
      email: reg.user?.email,
      checkedIn: !result.first,
    },
  });
}
