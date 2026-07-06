import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { listBookings } from "@/lib/bookings";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { toCsv } from "@/lib/csv";

export async function GET(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return new Response(JSON.stringify({ ok: false, error: "无权限" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const meeting = await requireCurrentMeetingForRequest(req);
  const bookings = await listBookings(meeting.id);
  const csv = toCsv(
    ["预订人邮箱", "酒店", "入住", "离店", "房间数", "状态", "提交时间"],
    bookings.map((b) => [
      b.user.email, b.hotel.name, b.checkIn, b.checkOut, String(b.rooms), b.status,
      b.createdAt.toISOString(),
    ]),
  );
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bookings-${meeting.id}.csv"`,
    },
  });
}
