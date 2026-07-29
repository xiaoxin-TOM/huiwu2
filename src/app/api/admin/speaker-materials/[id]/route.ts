import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { canAccessMeeting } from "@/lib/meetings";
import { materialReviewSchema } from "@/lib/validation";
import { getMaterialWithContext, reviewMaterial } from "@/lib/speaker-materials";
import { notifyMaterialReviewed } from "@/lib/notification-hooks";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/speaker-materials/[id]">) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!isAdmin(session?.user?.role) || !userId) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const parsed = materialReviewSchema.safeParse({
    decision: form?.get("decision") ?? "",
    reviewNote: form?.get("reviewNote") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  const { id } = await ctx.params;
  const material = await getMaterialWithContext(id);
  if (!material) {
    return NextResponse.json({ ok: false, error: "记录不存在" }, { status: 404 });
  }
  if (!(await canAccessMeeting(userId, material.speaker.meetingId))) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }

  await reviewMaterial(id, parsed.data.decision, userId, parsed.data.reviewNote);
  await notifyMaterialReviewed(id, parsed.data.decision, parsed.data.reviewNote);
  return NextResponse.json({ ok: true });
}
