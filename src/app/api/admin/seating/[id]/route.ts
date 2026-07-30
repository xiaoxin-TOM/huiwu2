import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { canAccessMeeting } from "@/lib/meetings";
import { seatTableSchema } from "@/lib/validation";
import { getSeatTable, updateSeatTable, deleteSeatTable } from "@/lib/seating-admin";

async function guard(id: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!isAdmin(session?.user?.role) || !userId) return { error: "无权限", status: 403 as const };
  const table = await getSeatTable(id);
  if (!table) return { error: "桌位不存在", status: 404 as const };
  if (!(await canAccessMeeting(userId, table.meetingId))) return { error: "无权限", status: 403 as const };
  return { table };
}

export async function POST(req: Request, ctx: RouteContext<"/api/admin/seating/[id]">) {
  const { id } = await ctx.params;
  const g = await guard(id);
  if (!g.table) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });

  const parsed = seatTableSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }
  try {
    await updateSeatTable(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002") {
      return NextResponse.json({ ok: false, error: "该桌号已存在" }, { status: 409 });
    }
    console.error("[update seat table]", id, error);
    return NextResponse.json({ ok: false, error: "保存失败" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: RouteContext<"/api/admin/seating/[id]">) {
  const { id } = await ctx.params;
  const g = await guard(id);
  if (!g.table) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  // 排座记录随桌位级联删除；桌子撤了，其排座自然作废
  await deleteSeatTable(id);
  return NextResponse.json({ ok: true });
}
