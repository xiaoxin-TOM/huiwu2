import { NextResponse } from "next/server";
import { bookingSchema } from "@/lib/validation";
import { currentUser } from "@/lib/session";
import { createBooking } from "@/lib/bookings";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }
  try {
    const b = await createBooking(user.id, parsed.data);
    return NextResponse.json({ ok: true, id: b.id });
  } catch (e) {
    if (e instanceof Error && e.message === "HOTEL_NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "酒店不存在" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "预订失败" }, { status: 500 });
  }
}
