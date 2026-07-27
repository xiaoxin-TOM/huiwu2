import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { canAccessMeeting } from "@/lib/meetings";
import { getReportLinkById, setReportLinkActive, deleteReportLink } from "@/lib/report-links";

async function requireOwnedLink(id: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!isAdmin(session?.user?.role) || !userId) return { error: "无权限", status: 403 as const };
  const link = await getReportLinkById(id);
  if (!link) return { error: "链接不存在", status: 404 as const };
  if (!(await canAccessMeeting(userId, link.meetingId))) return { error: "无权限", status: 403 as const };
  return { link };
}

export async function POST(req: Request, ctx: RouteContext<"/api/admin/report-links/[id]">) {
  const { id } = await ctx.params;
  const guard = await requireOwnedLink(id);
  if (!guard.link) return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });

  const form = await req.formData().catch(() => null);
  const action = form?.get("action")?.toString();
  if (action !== "activate" && action !== "deactivate") {
    return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });
  }

  await setReportLinkActive(id, action === "activate");
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: RouteContext<"/api/admin/report-links/[id]">) {
  const { id } = await ctx.params;
  const guard = await requireOwnedLink(id);
  if (!guard.link) return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });

  await deleteReportLink(id);
  return NextResponse.json({ ok: true });
}
