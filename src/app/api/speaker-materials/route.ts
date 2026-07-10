import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSpeakerByUserId } from "@/lib/speakers-admin";
import { getSpeakerSessions } from "@/lib/speakers";
import { createSpeakerMaterial } from "@/lib/speaker-materials";
import { uploadToOSS, validateSpeakerMaterial } from "@/lib/oss";
import { resolveMeetingId } from "@/lib/meetings";

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });
  }
  const exists = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true } });
  if (!exists) {
    return NextResponse.json({ ok: false, error: "登录状态异常，请重新登录" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const meetingIdRaw = form?.get("meetingId")?.toString() ?? "";
  let meetingId: string;
  try {
    meetingId = await resolveMeetingId(meetingIdRaw);
  } catch (e) {
    if (e instanceof Error && e.message === "NO_DEFAULT_MEETING") {
      return NextResponse.json({ ok: false, error: "当前无默认会议，请联系管理员" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "会议解析失败" }, { status: 500 });
  }

  const speaker = await getSpeakerByUserId(user.id, meetingId);
  if (!speaker) {
    return NextResponse.json({ ok: false, error: "您不是当前会议的认证讲者" }, { status: 403 });
  }

  const sessionId = form?.get("sessionId")?.toString() ?? "";
  const file = form?.get("file");
  if (!sessionId || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "请选择日程和文件" }, { status: 400 });
  }

  // 验证日程属于该讲者
  const sessions = await getSpeakerSessions(speaker.id, meetingId);
  if (!sessions.some((s) => s.id === sessionId)) {
    return NextResponse.json({ ok: false, error: "所选日程与当前讲者无关" }, { status: 400 });
  }

  const validationError = validateSpeakerMaterial({ type: file.type, size: file.size });
  if (validationError) {
    return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileUrl = await uploadToOSS({
      speakerId: speaker.id,
      fileName: file.name,
      buffer,
      mime: file.type,
      req,
    });
    const material = await createSpeakerMaterial({
      speakerId: speaker.id,
      sessionId,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
    });
    return NextResponse.json({ ok: true, material: { id: material.id, fileUrl, fileName: material.fileName } });
  } catch (error) {
    console.error("[upload material] speaker:", speaker.id, "error:", error);
    const message = error instanceof Error ? error.message : "上传失败";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
