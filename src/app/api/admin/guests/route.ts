import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { guestSchema } from "@/lib/validation";
import { createGuest } from "@/lib/guests-admin";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";

function parse(form: FormData | null) {
  return guestSchema.safeParse({
    name: form?.get("name") ?? "",
    phone: form?.get("phone") ?? "",
    email: form?.get("email") ?? "",
    company: form?.get("company") ?? "",
    title: form?.get("title") ?? "",
    level: form?.get("level") ?? "NORMAL",
    bio: form?.get("bio") ?? "",
    note: form?.get("note") ?? "",
    seatInfo: form?.get("seatInfo") ?? "",
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const meeting = await requireCurrentMeetingForRequest(req);
  const form = await req.formData().catch(() => null);
  const parsed = parse(form);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await createGuest(meeting.id, parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "创建失败" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
