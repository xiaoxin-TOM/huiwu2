import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { validateImage, saveImage } from "@/lib/upload";
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
    const url = await saveImage(file);
    await addPhoto(id, url, caption);
  } catch {
    return NextResponse.json({ ok: false, error: "上传失败" }, { status: 500 });
  }
  return NextResponse.redirect(new URL("/admin/albums", req.url), { status: 303 });
}
