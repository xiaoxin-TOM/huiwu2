import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { noticeSchema } from "@/lib/validation";
import { updateNotice } from "@/lib/notices-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/notices/[id]">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const parsed = noticeSchema.safeParse({
    title: form?.get("title") ?? "",
    contentHtml: form?.get("contentHtml") ?? "",
    isPublished: form?.get("isPublished") === "on",
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await updateNotice(id, parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "更新失败" }, { status: 400 });
  }
  return NextResponse.redirect(new URL("/admin/notices", req.url), { status: 303 });
}
