import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { reviewSchema } from "@/lib/validation";
import { reviewBooking } from "@/lib/bookings";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/bookings/[id]">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const parsed = reviewSchema.safeParse({ decision: form?.get("decision") });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });
  }
  try {
    await reviewBooking(id, parsed.data.decision);
  } catch {
    return NextResponse.json({ ok: false, error: "操作失败" }, { status: 400 });
  }
  return NextResponse.redirect(new URL("/admin/bookings", req.url), { status: 303 });
}
