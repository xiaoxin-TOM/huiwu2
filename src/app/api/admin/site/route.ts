import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { siteConfigSchema } from "@/lib/validation";
import { updateSiteConfig } from "@/lib/siteconfig";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const form = await req.formData().catch(() => null);
  const g = (k: string) => {
    const v = form?.get(k);
    return v == null ? undefined : String(v);
  };
  const parsed = siteConfigSchema.safeParse({
    confName: g("confName"),
    confDate: g("confDate"),
    confLocation: g("confLocation"),
    logoUrl: g("logoUrl"),
    liveUrl: g("liveUrl"),
    welcomeHtml: g("welcomeHtml"),
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await updateSiteConfig(parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "保存失败" }, { status: 500 });
  }
  return NextResponse.redirect(new URL("/admin/site", req.url), { status: 303 });
}
