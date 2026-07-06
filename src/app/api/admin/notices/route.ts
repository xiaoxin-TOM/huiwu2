import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { noticeSchema } from "@/lib/validation";
import { createNotice } from "@/lib/notices-admin";
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
  const parsed = noticeSchema.safeParse({
    title: form?.get("title") ?? "",
    contentHtml: form?.get("contentHtml") ?? "",
    isPublished: form?.get("isPublished") === "on",
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await createNotice(meetingId, parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "创建失败" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
