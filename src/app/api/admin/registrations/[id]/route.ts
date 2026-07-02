import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { reviewSchema } from "@/lib/validation";
import { reviewRegistration } from "@/lib/registrations";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/registrations/[id]">) {
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
    await reviewRegistration(id, parsed.data.decision);
  } catch {
    return NextResponse.json({ ok: false, error: "操作失败" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
