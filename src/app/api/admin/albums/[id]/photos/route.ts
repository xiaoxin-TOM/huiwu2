import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { validateImage, validateImageContent } from "@/lib/upload";
import { uploadAdminImageToOSS } from "@/lib/oss";
import { addPhoto } from "@/lib/albums";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/albums/[id]/photos">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const caption = (form?.get("caption") as string) ?? "";
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "请选择图片" }, { status: 400 });
  }
  const err = validateImage({ type: file.type, size: file.size });
  if (err) return NextResponse.json({ ok: false, error: err }, { status: 400 });
  try {
    const meeting = await requireCurrentMeetingForRequest(req);
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentError = validateImageContent(buffer, file.type);
    if (contentError) {
      return NextResponse.json({ ok: false, error: contentError }, { status: 400 });
    }
    const url = await uploadAdminImageToOSS({
      meetingId: meeting.id,
      buffer,
      mime: file.type,
      req,
    });
    await addPhoto(id, url, caption);
  } catch (error) {
    console.error("[album photo upload]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "上传失败" },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
