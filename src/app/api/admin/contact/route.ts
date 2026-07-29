import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { meetingContactSchema } from "@/lib/validation";
import { upsertMeetingContact } from "@/lib/feedback";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const parsed = meetingContactSchema.safeParse({
    orgName: form?.get("orgName") ?? "",
    phone: form?.get("phone") ?? "",
    phone2: form?.get("phone2") ?? "",
    email: form?.get("email") ?? "",
    wechatId: form?.get("wechatId") ?? "",
    address: form?.get("address") ?? "",
    wecomQrUrl: form?.get("wecomQrUrl") ?? "",
    groupQrUrl: form?.get("groupQrUrl") ?? "",
    mpQrUrl: form?.get("mpQrUrl") ?? "",
    wecomNote: form?.get("wecomNote") ?? "",
    groupNote: form?.get("groupNote") ?? "",
    mpNote: form?.get("mpNote") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  let meeting;
  try {
    meeting = await requireCurrentMeetingForRequest(req);
  } catch {
    return NextResponse.json({ ok: false, error: "无法确定当前会议" }, { status: 400 });
  }

  await upsertMeetingContact(meeting.id, parsed.data);
  return NextResponse.json({ ok: true });
}
