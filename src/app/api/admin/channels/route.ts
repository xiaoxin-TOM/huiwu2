import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { channelSchema } from "@/lib/validation";
import { createChannel } from "@/lib/channels-admin";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const meeting = await requireCurrentMeetingForRequest(req);
  const form = await req.formData().catch(() => null);
  const parsed = channelSchema.safeParse({
    code: form?.get("code") ?? "",
    name: form?.get("name") ?? "",
    owner: form?.get("owner") ?? "",
    note: form?.get("note") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }
  try {
    await createChannel(meeting.id, parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "创建失败,短码可能已存在" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
