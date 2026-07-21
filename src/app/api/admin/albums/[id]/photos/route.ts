import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { validateImage, validateImageContent } from "@/lib/upload";
import { uploadAdminImageToOSS } from "@/lib/oss";
import { addPhoto, addPhotos } from "@/lib/albums";

interface UploadResult {
  name: string;
  ok: boolean;
  error?: string;
}

export async function POST(req: Request, ctx: RouteContext<"/api/admin/albums/[id]/photos">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const caption = (form?.get("caption") as string) ?? "";

  // 兼容单文件 "file" 与批量 "files"
  const files: File[] = [];
  const singleFile = form?.get("file");
  if (singleFile instanceof File && singleFile.size > 0) files.push(singleFile);
  const multipleFiles = form?.getAll("files") ?? [];
  for (const f of multipleFiles) {
    if (f instanceof File && f.size > 0) files.push(f);
  }

  if (files.length === 0) {
    return NextResponse.json({ ok: false, error: "请选择图片" }, { status: 400 });
  }

  try {
    const meeting = await requireCurrentMeetingForRequest(req);
    const results: UploadResult[] = [];
    const successPhotos: { url: string; caption: string }[] = [];

    for (const file of files) {
      const err = validateImage({ type: file.type, size: file.size });
      if (err) {
        results.push({ name: file.name, ok: false, error: err });
        continue;
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const contentError = validateImageContent(buffer, file.type);
      if (contentError) {
        results.push({ name: file.name, ok: false, error: contentError });
        continue;
      }
      try {
        const url = await uploadAdminImageToOSS({
          meetingId: meeting.id,
          buffer,
          mime: file.type,
          req,
        });
        successPhotos.push({ url, caption });
        results.push({ name: file.name, ok: true });
      } catch (uploadError) {
        results.push({
          name: file.name,
          ok: false,
          error: uploadError instanceof Error ? uploadError.message : "上传失败",
        });
      }
    }

    if (successPhotos.length > 0) {
      if (successPhotos.length === 1 && files.length === 1) {
        await addPhoto(id, successPhotos[0].url, caption);
      } else {
        await addPhotos(id, successPhotos);
      }
    }

    const hasError = results.some((r) => !r.ok);
    return NextResponse.json(
      { ok: !hasError, results },
      { status: hasError ? 207 : 200 }
    );
  } catch (error) {
    console.error("[album photo upload]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "上传失败" },
      { status: 500 }
    );
  }
}
