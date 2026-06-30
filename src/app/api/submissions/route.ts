import { NextResponse } from "next/server";
import { submissionSchema } from "@/lib/validation";
import { currentUser } from "@/lib/session";
import { validatePdf, savePdf } from "@/lib/upload";
import { createSubmission } from "@/lib/submissions";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });

  const parsed = submissionSchema.safeParse({
    title: form.get("title"),
    authors: form.get("authors"),
    abstract: form.get("abstract"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "请上传 PDF 文件" }, { status: 400 });
  }
  const fileError = validatePdf({ type: file.type, size: file.size });
  if (fileError) return NextResponse.json({ ok: false, error: fileError }, { status: 400 });

  const fileUrl = await savePdf(file);
  const sub = await createSubmission(user.id, { ...parsed.data, fileUrl });
  return NextResponse.json({ ok: true, id: sub.id });
}
