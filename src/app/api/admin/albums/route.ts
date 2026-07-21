import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { albumSchema } from "@/lib/validation";
import { createAlbum } from "@/lib/albums";
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
  const getString = (value: FormDataEntryValue | null | undefined) => (typeof value === "string" ? value : "");
  const parsed = albumSchema.safeParse({
    title: getString(form?.get("title")),
    date: getString(form?.get("date")),
    note: getString(form?.get("note")),
    startTime: getString(form?.get("startTime")),
    endTime: getString(form?.get("endTime")),
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await createAlbum(meetingId, parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "创建失败" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
