import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { badgeTemplateSchema } from "@/lib/validation";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { upsertBadgeTemplate } from "@/lib/badge-template";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }

  const meeting = await requireCurrentMeetingForRequest(req);
  const form = await req.formData().catch(() => null);
  const g = (k: string) => {
    const v = form?.get(k);
    return v == null ? undefined : String(v);
  };

  const parsed = badgeTemplateSchema.safeParse({
    pageWidthMm: g("pageWidthMm"),
    pageHeightMm: g("pageHeightMm"),
    bgImageUrl: g("bgImageUrl"),
    nameX: g("nameX"),
    nameY: g("nameY"),
    nameSize: g("nameSize"),
    titleX: g("titleX"),
    titleY: g("titleY"),
    titleSize: g("titleSize"),
    companyX: g("companyX"),
    companyY: g("companyY"),
    companySize: g("companySize"),
    qrX: g("qrX"),
    qrY: g("qrY"),
    qrSize: g("qrSize"),
    meetingTitleX: g("meetingTitleX"),
    meetingTitleY: g("meetingTitleY"),
    meetingTitleSize: g("meetingTitleSize"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  try {
    await upsertBadgeTemplate(meeting.id, parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "保存失败" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }

  const meeting = await requireCurrentMeetingForRequest(req);

  try {
    await prisma.badgeTemplate.deleteMany({ where: { meetingId: meeting.id } });
  } catch {
    return NextResponse.json({ ok: false, error: "恢复失败" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
