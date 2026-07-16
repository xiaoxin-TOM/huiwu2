import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { receptionSchema } from "@/lib/validation";
import { updateReception, getReceptionById } from "@/lib/guests-admin";
import { updateRegistrationReception, getRegistrationReceptionById } from "@/lib/registrations";

function parse(form: FormData | null) {
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

export async function POST(req: Request, ctx: RouteContext<"/api/admin/receptions/[id]">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const parsed = parse(form);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    const guestReception = await getReceptionById(id);
    if (guestReception) {
      await updateReception(id, parsed.data);
    } else {
      const regReception = await getRegistrationReceptionById(id);
      if (!regReception) {
        return NextResponse.json({ ok: false, error: "记录不存在" }, { status: 404 });
      }
      await updateRegistrationReception(id, parsed.data);
    }
  } catch {
    return NextResponse.json({ ok: false, error: "更新失败" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
