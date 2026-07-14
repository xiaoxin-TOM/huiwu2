import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { pageSchema } from "@/lib/validation";
import { upsertPage, updatePage } from "@/lib/pages-admin";
import { getCurrentMeetingId } from "@/lib/meetings";

async function parsePageForm(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return { error: NextResponse.json({ ok: false, error: "无权限" }, { status: 403 }) };
  }
  const meetingId = await getCurrentMeetingId();
  if (!meetingId) {
    return { error: NextResponse.json({ ok: false, error: "未选择会议" }, { status: 400 }) };
  }
  const form = await req.formData().catch(() => null);
  const parsed = pageSchema.safeParse({
    title: form?.get("title") ?? "",
    contentHtml: form?.get("contentHtml") ?? "",
  });
  if (!parsed.success) {
    return { error: NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 }) };
  }
  return { data: parsed.data, meetingId, methodOverride: form?.get("_method")?.toString() };
}

export async function POST(req: Request, ctx: RouteContext<"/api/admin/pages/[slug]">) {
  const { slug } = await ctx.params;
  const result = await parsePageForm(req);
  if (result.error) return result.error;
  try {
    if (result.methodOverride === "put") {
      await updatePage(result.meetingId!, slug, result.data!);
    } else {
      await upsertPage(result.meetingId!, slug, result.data!);
    }
  } catch {
    return NextResponse.json({ ok: false, error: "保存失败" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request, ctx: RouteContext<"/api/admin/pages/[slug]">) {
  const { slug } = await ctx.params;
  const result = await parsePageForm(req);
  if (result.error) return result.error;
  try {
    await updatePage(result.meetingId!, slug, result.data!);
  } catch {
    return NextResponse.json({ ok: false, error: "更新失败，页面可能不存在" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
