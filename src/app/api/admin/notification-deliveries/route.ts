import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { requeueDelivery, requeueAllFailed } from "@/lib/notification-delivery";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const action = form?.get("action")?.toString();

  try {
    if (action === "requeue-all") {
      const result = await requeueAllFailed();
      return NextResponse.json({ ok: true, updated: result.count });
    }
    if (action === "requeue") {
      const id = form?.get("id")?.toString();
      if (!id) return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });
      await requeueDelivery(id);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });
  } catch (error) {
    console.error("[notification deliveries]", action, error);
    return NextResponse.json({ ok: false, error: "操作失败" }, { status: 500 });
  }
}
