import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { hotelSchema } from "@/lib/validation";
import { createHotel } from "@/lib/hotels-admin";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
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
    await createHotel(parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "创建失败" }, { status: 500 });
  }
  return NextResponse.redirect(new URL("/admin/hotels", req.url), { status: 303 });
}
