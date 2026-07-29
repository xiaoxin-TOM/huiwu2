import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { feedbackSchema } from "@/lib/validation";
import { createFeedback } from "@/lib/feedback";
import { resolveMeetingId } from "@/lib/meetings";
import { notifyFeedbackSubmitted } from "@/lib/notification-hooks";

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const parsed = feedbackSchema.safeParse({
    category: form?.get("category") ?? undefined,
    content: form?.get("content") ?? "",
    contact: form?.get("contact") ?? "",
    imageUrl: form?.get("imageUrl") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  let meetingId: string;
  try {
    meetingId = await resolveMeetingId(form?.get("meetingId")?.toString() ?? "");
  } catch {
    return NextResponse.json({ ok: false, error: "当前无默认会议，请联系管理员" }, { status: 400 });
  }

  const session = await auth();
  let userId = session?.user?.id ?? null;
  if (userId) {
    // 会话里的用户可能已被删除，留着会让写入外键失败
    const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!exists) userId = null;
  }

  // 未登录时要求留联系方式，否则处理完无从回访
  if (!userId && !parsed.data.contact.trim()) {
    return NextResponse.json(
      { ok: false, error: "请留下联系方式，便于我们回复您" },
      { status: 400 },
    );
  }

  try {
    const fb = await createFeedback(meetingId, userId, parsed.data);
    await notifyFeedbackSubmitted(fb.id);
    return NextResponse.json({ ok: true, id: fb.id });
  } catch (error) {
    console.error("[feedback] meeting:", meetingId, error);
    return NextResponse.json({ ok: false, error: "提交失败" }, { status: 500 });
  }
}
