import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { receptionBulkSchema } from "@/lib/validation";
import { bulkApplyReception } from "@/lib/receptions-admin";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = receptionBulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  let meeting;
  try {
    // 同时完成"当前会议"解析与该管理员的会议访问权校验
    meeting = await requireCurrentMeetingForRequest(req);
  } catch {
    return NextResponse.json({ ok: false, error: "无法确定当前会议" }, { status: 400 });
  }

  const { targets, fields, mode } = parsed.data;
  try {
    const result = await bulkApplyReception(meeting.id, targets, fields, mode);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[reception bulk] meeting:", meeting.id, "error:", error);
    return NextResponse.json({ ok: false, error: "批量设置失败" }, { status: 500 });
  }
}
