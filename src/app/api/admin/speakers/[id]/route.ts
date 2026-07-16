import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { speakerSchema } from "@/lib/validation";
import { updateSpeaker } from "@/lib/speakers-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/speakers/[id]">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const parsed = speakerSchema.safeParse({
    name: form?.get("name") ?? "",
    title: form?.get("title") ?? "",
    organization: form?.get("organization") ?? "",
    bio: form?.get("bio") ?? "",
    photoUrl: form?.get("photoUrl") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await updateSpeaker(id, parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "更新失败" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
