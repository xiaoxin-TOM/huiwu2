import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { guestSchema, receptionSchema } from "@/lib/validation";
import { updateGuest, upsertReception } from "@/lib/guests-admin";

function parseGuest(form: FormData | null) {
  return guestSchema.safeParse({
    name: form?.get("name") ?? "",
    phone: form?.get("phone") ?? "",
    email: form?.get("email") ?? "",
    company: form?.get("company") ?? "",
    title: form?.get("title") ?? "",
    level: form?.get("level") ?? "NORMAL",
    bio: form?.get("bio") ?? "",
    note: form?.get("note") ?? "",
    seatInfo: form?.get("seatInfo") ?? "",
  });
}

function parseReception(form: FormData | null) {
  return receptionSchema.safeParse({
    arriveMode: form?.get("arriveMode") ?? "",
    arriveNo: form?.get("arriveNo") ?? "",
    arriveTime: form?.get("arriveTime") ?? "",
    arrivePlace: form?.get("arrivePlace") ?? "",
    departMode: form?.get("departMode") ?? "",
    departNo: form?.get("departNo") ?? "",
    departTime: form?.get("departTime") ?? "",
    hotelName: form?.get("hotelName") ?? "",
    hotelRoom: form?.get("hotelRoom") ?? "",
    hotelCheckIn: form?.get("hotelCheckIn") ?? "",
    hotelCheckOut: form?.get("hotelCheckOut") ?? "",
    carPlate: form?.get("carPlate") ?? "",
    carDriver: form?.get("carDriver") ?? "",
    carDriverPhone: form?.get("carDriverPhone") ?? "",
    carContact: form?.get("carContact") ?? "",
    remark: form?.get("remark") ?? "",
  });
}

export async function POST(req: Request, ctx: RouteContext<"/api/admin/guests/[id]">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const guestParsed = parseGuest(form);
  if (!guestParsed.success) {
    return NextResponse.json({ ok: false, error: guestParsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await updateGuest(id, guestParsed.data);
    const receptionParsed = parseReception(form);
    if (receptionParsed.success) {
      await upsertReception(id, receptionParsed.data);
    }
  } catch {
    return NextResponse.json({ ok: false, error: "更新失败" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
