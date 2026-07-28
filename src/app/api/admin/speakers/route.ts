import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { speakerSchema } from "@/lib/validation";
import { createSpeakerWithGuest } from "@/lib/speakers-admin";
import { getCurrentMeetingId } from "@/lib/meetings";

function parse(form: FormData | null) {
  return speakerSchema.safeParse({
    name: form?.get("name") ?? "",
    title: form?.get("title") ?? "",
    organization: form?.get("organization") ?? "",
    bio: form?.get("bio") ?? "",
    photoUrl: form?.get("photoUrl") ?? "",
  });
}

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
  const parsed = parse(form);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    // 讲者与其嘉宾记录同一事务写入，避免留下没有嘉宾记录的孤儿讲者
    await createSpeakerWithGuest(meetingId, parsed.data);
  } catch (error) {
    console.error("[create speaker] meeting:", meetingId, "error:", error);
    return NextResponse.json({ ok: false, error: "创建失败" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
