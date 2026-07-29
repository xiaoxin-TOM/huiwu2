import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markAllNotificationsRead } from "@/lib/notifications";

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });
  }
  const meetingId = new URL(req.url).searchParams.get("m") ?? undefined;
  const result = await markAllNotificationsRead(userId, meetingId);
  return NextResponse.json({ ok: true, updated: result.count });
}
