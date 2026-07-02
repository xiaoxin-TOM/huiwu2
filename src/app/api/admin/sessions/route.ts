import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { sessionSchema } from "@/lib/validation";
import { createSession } from "@/lib/schedule-admin";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const form = await req.formData().catch(() => null);
  const parsed = sessionSchema.safeParse({
    day: form?.get("day") ?? "",
    startTime: form?.get("startTime") ?? "",
    endTime: form?.get("endTime") ?? "",
    room: form?.get("room") ?? "",
    title: form?.get("title") ?? "",
    isBrief: form?.get("isBrief") === "on",
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await createSession(parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "创建失败" }, { status: 500 });
  }
  return NextResponse.redirect("/admin/schedule", { status: 303 });
}
