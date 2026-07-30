import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { applyTemplateSchema, saveTemplateSchema } from "@/lib/validation";
import {
  resolveTemplate,
  applyTemplateToMeeting,
  saveMeetingAsTemplate,
} from "@/lib/meeting-templates-admin";

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!isAdmin(session?.user?.role) || !userId) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "";

  let meeting;
  try {
    meeting = await requireCurrentMeetingForRequest(req);
  } catch {
    return NextResponse.json({ ok: false, error: "无法确定当前会议" }, { status: 400 });
  }

  if (action === "apply") {
    const parsed = applyTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
        { status: 400 },
      );
    }
    const template = await resolveTemplate(parsed.data.templateKey, userId);
    if (!template) {
      return NextResponse.json({ ok: false, error: "模板不存在" }, { status: 404 });
    }
    try {
      const count = await applyTemplateToMeeting(meeting.id, template);
      return NextResponse.json({ ok: true, applied: count, name: template.name });
    } catch (error) {
      console.error("[apply template]", parsed.data.templateKey, error);
      return NextResponse.json({ ok: false, error: "套用失败" }, { status: 500 });
    }
  }

  if (action === "save") {
    const parsed = saveTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
        { status: 400 },
      );
    }
    try {
      const created = await saveMeetingAsTemplate({
        meetingId: meeting.id,
        ownerId: userId,
        name: parsed.data.name,
        description: parsed.data.description,
      });
      return NextResponse.json({ ok: true, id: created.id });
    } catch (error) {
      if (error instanceof Error && error.message === "NO_ITEMS") {
        return NextResponse.json({ ok: false, error: "当前会议还没有宫格入口，无法另存" }, { status: 400 });
      }
      console.error("[save template]", error);
      return NextResponse.json({ ok: false, error: "另存失败" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });
}
