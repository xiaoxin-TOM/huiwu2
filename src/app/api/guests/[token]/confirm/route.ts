import { NextResponse } from "next/server";
import { confirmGuest, getGuestByToken } from "@/lib/guests-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/guests/[token]/confirm">) {
  const { token } = await ctx.params;
  try {
    const guest = await getGuestByToken(token);
    if (!guest) {
      return NextResponse.json({ ok: false, error: "未找到嘉宾" }, { status: 404 });
    }
    if (guest.confirmed) {
      return NextResponse.json({ ok: true, already: true });
    }
    await confirmGuest(token);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "确认失败" }, { status: 500 });
  }
}
