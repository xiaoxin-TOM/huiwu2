import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { siteConfigSchema } from "@/lib/validation";
import { getCurrentMeetingId, updateMeetingConfig } from "@/lib/meetings";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const meetingId = await getCurrentMeetingId();
  if (!meetingId) {
    return NextResponse.json({ ok: false, error: "未选择会议" }, { status: 400 });
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
    heroImageUrl: g("heroImageUrl"),
    liveUrl: g("liveUrl"),
    welcomeHtml: g("welcomeHtml"),
    footerHtml: g("footerHtml"),
    venueAddress: g("venueAddress"),
    venueLng: g("venueLng"),
    venueLat: g("venueLat"),
    requirePassword: form?.get("requirePassword") === "on",
    registrationPassword: g("registrationPassword"),
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await updateMeetingConfig(meetingId, {
      title: parsed.data.confName,
      confDate: parsed.data.confDate,
      location: parsed.data.confLocation,
      logoUrl: parsed.data.logoUrl || null,
      heroImageUrl: parsed.data.heroImageUrl || null,
      liveUrl: parsed.data.liveUrl || null,
      welcomeHtml: parsed.data.welcomeHtml,
      footerHtml: parsed.data.footerHtml,
      venueAddress: parsed.data.venueAddress,
      venueLng: parsed.data.venueLng,
      venueLat: parsed.data.venueLat,
      requirePassword: parsed.data.requirePassword,
      registrationPassword: parsed.data.registrationPassword,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "保存失败" }, { status: 500 });
  }
  let redirectTo = form?.get("redirectTo")?.toString() ?? "/admin";
  if (!redirectTo.startsWith("/")) redirectTo = "/admin";
  return NextResponse.json({ ok: true, redirectTo });
}
