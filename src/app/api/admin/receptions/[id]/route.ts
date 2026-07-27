import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { canAccessMeeting } from "@/lib/meetings";
import { RECEPTION_FIELDS, receptionPatchSchema } from "@/lib/validation";
import { findReceptionOwner } from "@/lib/receptions-admin";
import { updateReception } from "@/lib/guests-admin";
import { updateRegistrationReception } from "@/lib/registrations";

/**
 * 只取表单里真正出现过的字段。房间号内联编辑等局部提交必须走这条路径，
 * 否则未提交的字段会被当成空值写回，抹掉整条接待信息。
 */
function parse(form: FormData | null) {
  const raw: Record<string, string> = {};
  for (const key of RECEPTION_FIELDS) {
    const value = form?.get(key);
    if (value !== null && value !== undefined) raw[key] = String(value);
  }
  return receptionPatchSchema.safeParse(raw);
}

export async function POST(req: Request, ctx: RouteContext<"/api/admin/receptions/[id]">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const parsed = parse(form);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  const owner = await findReceptionOwner(id);
  if (!owner) {
    return NextResponse.json({ ok: false, error: "记录不存在" }, { status: 404 });
  }
  // 会议隔离：管理员只能改自己有权访问的会议下的接待记录
  const userId = session?.user?.id;
  if (!userId || !(await canAccessMeeting(userId, owner.meetingId))) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }

  try {
    if (owner.kind === "guest") {
      await updateReception(id, parsed.data);
    } else {
      await updateRegistrationReception(id, parsed.data);
    }
  } catch {
    return NextResponse.json({ ok: false, error: "更新失败" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
