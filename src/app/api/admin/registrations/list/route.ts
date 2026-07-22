import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { listRegistrationsPaged, type RegistrationBucket } from "@/lib/registrations";

export async function GET(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const typeId = searchParams.get("typeId") || undefined;
  const organization = searchParams.get("organization") || undefined;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const bucketParam = searchParams.get("bucket");
  const bucket: RegistrationBucket = bucketParam === "REGISTERED" ? "REGISTERED" : "UNREGISTERED";

  try {
    const meeting = await requireCurrentMeetingForRequest(req);
    const { items, total, pageSize } = await listRegistrationsPaged(meeting.id, {
      typeId,
      organization,
      page,
      bucket,
    });
    return NextResponse.json({
      ok: true,
      items: items.map((r) => ({
        id: r.id,
        fullName: r.fullName,
        email: r.user.email,
        phone: r.phone,
        typeId: r.typeId,
        typeName: r.type.name,
        organization: r.organization,
        status: r.status,
        checkedIn: r.checkedIn,
      })),
      total,
      page,
      pageSize,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "获取报名列表失败" }, { status: 500 });
  }
}
