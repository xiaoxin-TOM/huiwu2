import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { sessionSpeakerSchema } from "@/lib/validation";
import { addSessionSpeaker } from "@/lib/schedule-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/sessions/[id]/speakers">) {
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
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await addSessionSpeaker(id, parsed.data.speakerId, parsed.data.role);
  } catch (e) {
    if (e instanceof Error && e.message === "DUPLICATE_LINK") {
      return NextResponse.json({ ok: false, error: "该讲者已在此场次担任该角色" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "指派失败" }, { status: 400 });
  }
  return NextResponse.redirect(new URL(`/admin/schedule/${id}`, req.url), { status: 303 });
}
