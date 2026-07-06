import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { sessionSchema } from "@/lib/validation";
import { createSessionWithSpeakers } from "@/lib/schedule-admin";
import { getCurrentMeetingId } from "@/lib/meetings";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const meetingId = await getCurrentMeetingId();
  if (!meetingId) {
    return NextResponse.json({ ok: false, error: "未选择会议" }, { status: 400 });
  }
  const form = await req.formData().catch(() => null);
  const parsed = sessionSchema.safeParse({
    day: form?.get("day") ?? "",
    startTime: form?.get("startTime") ?? "",
    endTime: form?.get("endTime") ?? "",
    room: form?.get("room") ?? "",
    title: form?.get("title") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const speakerIds = form?.getAll("speakerId") ?? [];
  const roles = form?.getAll("role") ?? [];
  const links: { speakerId: string; role: string }[] = [];
  for (let i = 0; i < speakerIds.length; i++) {
    const speakerId = String(speakerIds[i] ?? "");
    const role = String(roles[i] ?? "");
    if (speakerId && (role === "SPEAKER" || role === "MODERATOR")) {
      links.push({ speakerId, role });
    }
  }

  try {
    await createSessionWithSpeakers(meetingId, parsed.data, links);
  } catch {
    return NextResponse.json({ ok: false, error: "创建失败" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
