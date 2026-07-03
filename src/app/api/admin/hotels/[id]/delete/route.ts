import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { deleteHotel } from "@/lib/hotels-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/hotels/[id]/delete">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    await deleteHotel(id);
  } catch {
    // HotelBooking.hotel 为 Restrict:有预订时删除失败
    return NextResponse.json({ ok: false, error: "该酒店存在预订,无法删除" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
