import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { sessionSpeakerSchema } from "@/lib/validation";
import { removeSessionSpeaker } from "@/lib/schedule-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/sessions/[id]/speakers/delete">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const parsed = sessionSpeakerSchema.safeParse({
    speakerId: form?.get("speakerId") ?? "",
    role: form?.get("role") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });
  }
  try {
    await removeSessionSpeaker(id, parsed.data.speakerId, parsed.data.role);
  } catch {
    return NextResponse.json({ ok: false, error: "撤销失败" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
