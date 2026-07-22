import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { canAccessMeeting } from "@/lib/meetings";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role) || !session?.user?.id) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const form = await req.formData().catch(() => null);
  const id = (form?.get("id") ?? "").toString();
  if (!id) {
    return NextResponse.json({ ok: false, error: "缺少会议 ID" }, { status: 400 });
  }
  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting) {
    return NextResponse.json({ ok: false, error: "会议不存在" }, { status: 404 });
  }
  if (!(await canAccessMeeting(session.user.id, id))) {
    return NextResponse.json({ ok: false, error: "无权访问该会议" }, { status: 403 });
  }
  (await cookies()).set("admin_meeting_id", id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  return NextResponse.json({ ok: true });
}
