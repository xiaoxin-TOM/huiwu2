import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { canAccessMeeting } from "@/lib/meetings";
import { mealRedeemSchema } from "@/lib/validation";
import { getMealSession, redeemMeal } from "@/lib/meals-admin";

/** 现场核销。复用报名的签到凭证 Registration.token，不另发餐券。 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!isAdmin(session?.user?.role) || !userId) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = mealRedeemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  const meal = await getMealSession(parsed.data.mealSessionId);
  if (!meal) {
    return NextResponse.json({ ok: false, error: "餐次不存在" }, { status: 404 });
  }
  if (!(await canAccessMeeting(userId, meal.meetingId))) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }

  try {
    const result = await redeemMeal({
      mealSessionId: parsed.data.mealSessionId,
      token: parsed.data.token,
      byUserId: userId,
    });

    switch (result.status) {
      // OK / ALREADY / NOT_ELIGIBLE 都是需要明确告知现场人员的状态，不算接口错误
      case "OK":
      case "ALREADY":
      case "NOT_ELIGIBLE":
        return NextResponse.json({ ok: true, ...result });
      case "WRONG_MEETING":
        return NextResponse.json({ ok: false, error: "该凭证不属于本会议" }, { status: 400 });
      default:
        return NextResponse.json({ ok: false, error: "未找到报名记录" }, { status: 404 });
    }
  } catch (error) {
    console.error("[redeem meal]", parsed.data.mealSessionId, error);
    return NextResponse.json({ ok: false, error: "核销失败" }, { status: 500 });
  }
}
