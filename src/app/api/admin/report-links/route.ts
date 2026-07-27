import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { reportLinkSchema } from "@/lib/validation";
import { createReportLink } from "@/lib/report-links";

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!isAdmin(session?.user?.role) || !userId) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const parsed = reportLinkSchema.safeParse({
    name: form?.get("name") ?? "",
    password: form?.get("password") ?? "",
    expiresAt: form?.get("expiresAt") ?? "",
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

  const link = await createReportLink({
    meetingId: meeting.id,
    name: parsed.data.name,
    password: parsed.data.password,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    createdById: userId,
  });

  return NextResponse.json({ ok: true, token: link.token, path: `/p/${link.token}` });
}
