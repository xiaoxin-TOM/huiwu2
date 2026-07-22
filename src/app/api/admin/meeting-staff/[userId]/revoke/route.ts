import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { revokeMeetingStaff } from "@/lib/meeting-staff";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/meeting-staff/[userId]/revoke">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { userId } = await ctx.params;
  try {
    const meeting = await requireCurrentMeetingForRequest(req);
    await revokeMeetingStaff(meeting.id, userId);
  } catch {
    return NextResponse.json({ ok: false, error: "撤销失败" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
