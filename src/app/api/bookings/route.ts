import { NextResponse } from "next/server";
import { bookingSchema } from "@/lib/validation";
import { currentUser } from "@/lib/session";
import { createBooking } from "@/lib/bookings";
import { resolveMeetingId } from "@/lib/meetings";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }
  try {
    const meetingId = await resolveMeetingId(body.meetingId);
    const b = await createBooking(user.id, meetingId, parsed.data);
    return NextResponse.json({ ok: true, id: b.id });
  } catch (e) {
    if (e instanceof Error && e.message === "HOTEL_NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "酒店不存在" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "NO_DEFAULT_MEETING") {
      return NextResponse.json({ ok: false, error: "当前无默认会议，请联系管理员" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "预订失败" }, { status: 500 });
  }
}
