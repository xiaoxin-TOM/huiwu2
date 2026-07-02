import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { hotelSchema } from "@/lib/validation";
import { updateHotel } from "@/lib/hotels-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/hotels/[id]">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const parsed = hotelSchema.safeParse({
    name: form?.get("name") ?? "",
    description: form?.get("description") ?? "",
    price: form?.get("price") ?? "0",
    address: form?.get("address") ?? "",
    imageUrl: form?.get("imageUrl") ?? "",
    distance: form?.get("distance") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await updateHotel(id, parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "更新失败" }, { status: 400 });
  }
  return NextResponse.redirect("/admin/hotels", { status: 303 });
}
