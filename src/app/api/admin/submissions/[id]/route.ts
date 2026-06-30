import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { reviewSchema } from "@/lib/validation";
import { reviewSubmission } from "@/lib/submissions";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/submissions/[id]">) {
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
  await reviewSubmission(id, parsed.data.decision);
  return NextResponse.redirect(new URL("/admin/submissions", req.url), { status: 303 });
}
