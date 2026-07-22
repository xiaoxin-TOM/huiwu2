import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { authorizeMeetingStaffSchema } from "@/lib/validation";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { authorizeUserForMeeting } from "@/lib/meeting-staff";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = authorizeMeetingStaffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    const meeting = await requireCurrentMeetingForRequest(req);
    const staff = await authorizeUserForMeeting(meeting.id, parsed.data.email);
    return NextResponse.json({ ok: true, staff });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "USER_NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "未找到该邮箱对应的用户，请确认对方已注册" }, { status: 400 });
    }
    if (message === "ALREADY_OWNER") {
      return NextResponse.json({ ok: false, error: "该用户已是本会议的创建者" }, { status: 400 });
    }
    if (message === "ALREADY_AUTHORIZED") {
      return NextResponse.json({ ok: false, error: "该用户已被授权管理本会议" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "授权失败" }, { status: 500 });
  }
}
