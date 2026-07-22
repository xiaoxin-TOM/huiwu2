import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { meetingSchema } from "@/lib/validation";
import { updateMeeting, canAccessMeeting } from "@/lib/meetings";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/meetings/[id]">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role) || !session?.user?.id) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  if (!(await canAccessMeeting(session.user.id, id))) {
    return NextResponse.json({ ok: false, error: "无权访问该会议" }, { status: 403 });
  }
  const form = await req.formData().catch(() => null);
  const parsed = meetingSchema.safeParse({
    title: form?.get("title") ?? "",
    description: form?.get("description") ?? "",
    location: form?.get("location") ?? "",
    startDate: form?.get("startDate") ?? "",
    endDate: form?.get("endDate") ?? "",
    requireApproval: form?.get("requireApproval") ?? "off",
    registrationLimit: form?.get("registrationLimit") ?? null,
    opensAt: form?.get("opensAt") ?? null,
    closesAt: form?.get("closesAt") ?? null,
    requirePassword: form?.get("requirePassword") ?? "off",
    registrationPassword: form?.get("registrationPassword") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }
  try {
    await updateMeeting(id, parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "更新失败" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
