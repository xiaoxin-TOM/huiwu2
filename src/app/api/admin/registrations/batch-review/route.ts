import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { batchReviewRegistrations, REGISTRATIONS_PAGE_SIZE } from "@/lib/registrations";
import { notifyRegistrationReviewed } from "@/lib/notification-hooks";

const batchReviewSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "请至少选择一条报名").max(REGISTRATIONS_PAGE_SIZE, "单次最多处理 20 条"),
  decision: z.enum(["APPROVED", "REJECTED"]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = batchReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    const meeting = await requireCurrentMeetingForRequest(req);
    const count = await batchReviewRegistrations(meeting.id, parsed.data.ids, parsed.data.decision);
    // 逐条通知；串行以免一次批量审核瞬间打出大量并发写入
    for (const id of parsed.data.ids) {
      await notifyRegistrationReviewed(id, parsed.data.decision);
    }
    return NextResponse.json({ ok: true, count });
  } catch {
    return NextResponse.json({ ok: false, error: "批量操作失败" }, { status: 500 });
  }
}
