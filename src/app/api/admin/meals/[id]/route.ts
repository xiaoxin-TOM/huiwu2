import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { canAccessMeeting } from "@/lib/meetings";
import { mealSessionSchema } from "@/lib/validation";
import { getMealSession, updateMealSession, deleteMealSession } from "@/lib/meals-admin";

/** 校验餐次存在且属于该管理员有权访问的会议 */
async function guard(id: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!isAdmin(session?.user?.role) || !userId) return { error: "无权限", status: 403 as const };
  const meal = await getMealSession(id);
  if (!meal) return { error: "餐次不存在", status: 404 as const };
  if (!(await canAccessMeeting(userId, meal.meetingId))) return { error: "无权限", status: 403 as const };
  return { meal };
}

export async function POST(req: Request, ctx: RouteContext<"/api/admin/meals/[id]">) {
  const { id } = await ctx.params;
  const g = await guard(id);
  if (!g.meal) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });

  const body = await req.json().catch(() => null);
  const parsed = mealSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  try {
    await updateMealSession(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002") {
      return NextResponse.json({ ok: false, error: "该日期的这个餐次已存在" }, { status: 409 });
    }
    console.error("[update meal]", id, error);
    return NextResponse.json({ ok: false, error: "保存失败" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: RouteContext<"/api/admin/meals/[id]">) {
  const { id } = await ctx.params;
  const g = await guard(id);
  if (!g.meal) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });

  // 核销记录随餐次级联删除，这是有意的：餐次不存在了，其核销记录也无意义
  await deleteMealSession(id);
  return NextResponse.json({ ok: true });
}
