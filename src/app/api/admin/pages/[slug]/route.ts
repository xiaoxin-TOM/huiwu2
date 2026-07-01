import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { pageSchema } from "@/lib/validation";
import { upsertPage } from "@/lib/pages-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/pages/[slug]">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { slug } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const parsed = pageSchema.safeParse({
    title: form?.get("title") ?? "",
    contentHtml: form?.get("contentHtml") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await upsertPage(slug, parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "保存失败" }, { status: 500 });
  }
  return NextResponse.redirect(new URL("/admin/pages", req.url), { status: 303 });
}
