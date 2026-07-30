import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { mealSessionSchema } from "@/lib/validation";
import { createMealSession } from "@/lib/meals-admin";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = mealSessionSchema.safeParse(body);
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

  try {
    const created = await createMealSession(meeting.id, parsed.data);
    return NextResponse.json({ ok: true, id: created.id });
  } catch (error) {
    // 同一会议同一天同一餐次只能有一条
    if (typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002") {
      return NextResponse.json({ ok: false, error: "该日期的这个餐次已存在" }, { status: 409 });
    }
    console.error("[create meal]", error);
    return NextResponse.json({ ok: false, error: "创建失败" }, { status: 500 });
  }
}
