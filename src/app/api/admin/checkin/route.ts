import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { findRegistrationByToken, recordCheckin } from "@/lib/registrations";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }

  let body: { token?: string; registrationId?: string; method?: "SCAN" | "MANUAL" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });
  }

  let reg;
  if (body.token?.trim()) {
    reg = await findRegistrationByToken(body.token.trim());
  } else if (body.registrationId?.trim()) {
    reg = await prisma.registration.findUnique({
      where: { id: body.registrationId.trim() },
      include: { user: true, type: true },
    });
  }

  if (!reg) {
    return NextResponse.json({ ok: false, error: "未找到报名记录" }, { status: 404 });
  }

  const method = body.method ?? "SCAN";
  const byUserId = session?.user?.id;
  const result = await recordCheckin(reg.id, { method, byUserId });

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
