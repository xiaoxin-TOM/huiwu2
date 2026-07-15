import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { uploadHomeGridImageToOSS } from "@/lib/oss";
import { validateImage, validateImageContent } from "@/lib/upload";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "请选择图片" }, { status: 400 });
  }

  const validationError = validateImage({ type: file.type, size: file.size });
  if (validationError) {
    return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
  }

  try {
    const meeting = await requireCurrentMeetingForRequest(req);
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentError = validateImageContent(buffer, file.type);
    if (contentError) {
      return NextResponse.json({ ok: false, error: contentError }, { status: 400 });
    }
    const url = await uploadHomeGridImageToOSS({
      meetingId: meeting.id,
      buffer,
      mime: file.type,
      req,
    });
    return NextResponse.json({ ok: true, url });
  } catch (error) {
    console.error("[home-grid image upload]", error);
    const message = error instanceof Error ? error.message : "上传失败";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
