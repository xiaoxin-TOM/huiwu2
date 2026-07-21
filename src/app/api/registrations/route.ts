import { NextResponse } from "next/server";
import { registrationSchema } from "@/lib/validation";
import { currentUser } from "@/lib/session";
import { createRegistration } from "@/lib/registrations";
import { resolveMeetingId } from "@/lib/meetings";
import { getChannelIdFromCode } from "@/lib/channels-admin";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });
  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }
  try {
    const meetingId = await resolveMeetingId(body.meetingId);
    // 渠道归因：优先 cookie，其次 body 里的 channelCode
    const cookie = req.headers.get("cookie") ?? "";
    const channelMatch = cookie.match(/channel_code=([^;]+)/);
    const channelCode = body.channelCode ?? channelMatch?.[1];
    const channelId = channelCode ? (await getChannelIdFromCode(meetingId, channelCode)) ?? undefined : undefined;
    const reg = await createRegistration(user.id, meetingId, parsed.data, { channelId });
    return NextResponse.json({ ok: true, id: reg.id });
  } catch (e) {
    if (e instanceof Error && e.message === "ALREADY_REGISTERED") {
      return NextResponse.json({ ok: false, error: "您已报名,不能重复提交" }, { status: 409 });
    }
    if (e instanceof Error && e.message === "TYPE_NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "参会类型不存在" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "INVALID_PASSWORD") {
      return NextResponse.json({ ok: false, error: "报名密码不正确" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "NO_DEFAULT_MEETING") {
      return NextResponse.json({ ok: false, error: "当前无默认会议，请联系管理员" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "报名失败" }, { status: 500 });
  }
}
