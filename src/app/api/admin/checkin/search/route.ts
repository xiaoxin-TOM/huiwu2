import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { searchRegistrations } from "@/lib/registrations";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";

export async function GET(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const meeting = await requireCurrentMeetingForRequest(req);
  const list = await searchRegistrations(q, meeting.id);
  return NextResponse.json({
    ok: true,
    list: list.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      organization: r.organization,
      phone: r.phone,
      email: r.user?.email,
      type: r.type?.name,
      status: r.status,
      checkedIn: r.checkedIn,
      checkedInAt: r.checkedInAt?.toISOString() ?? null,
      token: r.token,
    })),
  });
}
