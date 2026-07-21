import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { scheduleImageModeSchema } from "@/lib/validation";
import { requireCurrentMeetingForRequest, updateScheduleImageMode } from "@/lib/meetings";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = scheduleImageModeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    const meeting = await requireCurrentMeetingForRequest(req);
    await updateScheduleImageMode(meeting.id, parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "保存失败" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
