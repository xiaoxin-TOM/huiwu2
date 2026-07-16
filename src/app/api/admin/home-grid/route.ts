import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { replaceHomeGridItems, setHomeGridColumns } from "@/lib/home-grid";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { homeGridSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = homeGridSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  try {
    const meeting = await requireCurrentMeetingForRequest(req);
    await Promise.all([
      setHomeGridColumns(meeting.id, parsed.data.columns as 2 | 3 | 4),
      replaceHomeGridItems(meeting.id, parsed.data.items),
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "保存失败" }, { status: 500 });
  }
}
