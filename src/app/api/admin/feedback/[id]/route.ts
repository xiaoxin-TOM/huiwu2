import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { canAccessMeeting } from "@/lib/meetings";
import { feedbackReplySchema } from "@/lib/validation";
import { getFeedbackById, replyFeedback, reopenFeedback } from "@/lib/feedback";
import { notifyFeedbackReplied } from "@/lib/notification-hooks";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/feedback/[id]">) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!isAdmin(session?.user?.role) || !userId) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const feedback = await getFeedbackById(id);
  if (!feedback) {
    return NextResponse.json({ ok: false, error: "记录不存在" }, { status: 404 });
  }
  // 会议隔离：只能处理自己有权访问的会议下的反馈
  if (!(await canAccessMeeting(userId, feedback.meetingId))) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const action = form?.get("action")?.toString() ?? "reply";

  if (action === "reopen") {
    await reopenFeedback(id);
    return NextResponse.json({ ok: true });
  }

  const parsed = feedbackReplySchema.safeParse({ reply: form?.get("reply") ?? "" });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  await replyFeedback(id, parsed.data.reply, userId);
  await notifyFeedbackReplied(id);
  return NextResponse.json({ ok: true });
}
