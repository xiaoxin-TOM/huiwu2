import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { meetingSchema } from "@/lib/validation";
import { createMeeting } from "@/lib/meetings";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const form = await req.formData().catch(() => null);
  const parsed = meetingSchema.safeParse({
    title: form?.get("title") ?? "",
    description: form?.get("description") ?? "",
    location: form?.get("location") ?? "",
    startDate: form?.get("startDate") ?? "",
    endDate: form?.get("endDate") ?? "",
    requireApproval: form?.get("requireApproval") === "on",
    registrationLimit: form?.get("registrationLimit") ?? null,
    opensAt: form?.get("opensAt") ?? null,
    closesAt: form?.get("closesAt") ?? null,
    requirePassword: form?.get("requirePassword") === "on",
    registrationPassword: form?.get("registrationPassword") ?? "",
    requireRealName: form?.get("requireRealName") === "on",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }
  try {
    await createMeeting({ ...parsed.data, ownerId: session?.user?.id });
  } catch {
    return NextResponse.json({ ok: false, error: "创建失败" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
