import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { deleteRegistrationTypeWithTransfer } from "@/lib/registrations";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/registration-types/[id]/delete">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const targetTypeId = form?.get("targetTypeId")?.toString();
  try {
    await deleteRegistrationTypeWithTransfer(id, targetTypeId);
  } catch {
    return NextResponse.json({ ok: false, error: "删除失败，可能已有报名关联" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
