import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { seatTableSchema, seatAssignSchema, seatMapSchema } from "@/lib/validation";
import {
  createSeatTable,
  getSeatTable,
  assignSeat,
  removeSeatAssignment,
  updateSeatMap,
} from "@/lib/seating-admin";

/** 桌位新增、排座、移除排座、平面图设置，按 action 分发 */
export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "";

  let meeting;
  try {
    meeting = await requireCurrentMeetingForRequest(req);
  } catch {
    return NextResponse.json({ ok: false, error: "无法确定当前会议" }, { status: 400 });
  }

  if (action === "create-table") {
    const parsed = seatTableSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
        { status: 400 },
      );
    }
    try {
      const created = await createSeatTable(meeting.id, parsed.data);
      return NextResponse.json({ ok: true, id: created.id });
    } catch (error) {
      if (typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002") {
        return NextResponse.json({ ok: false, error: "该桌号已存在" }, { status: 409 });
      }
      console.error("[create seat table]", error);
      return NextResponse.json({ ok: false, error: "创建失败" }, { status: 500 });
    }
  }

  if (action === "assign") {
    const parsed = seatAssignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
        { status: 400 },
      );
    }
    // 桌位必须属于当前会议
    const table = await getSeatTable(parsed.data.seatTableId);
    if (!table || table.meetingId !== meeting.id) {
      return NextResponse.json({ ok: false, error: "桌位不存在" }, { status: 404 });
    }
    const outcome = await assignSeat({
      seatTableId: parsed.data.seatTableId,
      meetingId: meeting.id,
      registrationId: parsed.data.registrationId,
      guestId: parsed.data.guestId,
      seatNo: parsed.data.seatNo,
    });
    if (outcome === "NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "该人员不属于本会议" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, outcome });
  }

  if (action === "unassign") {
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });
    const ok = await removeSeatAssignment(id, meeting.id);
    if (!ok) return NextResponse.json({ ok: false, error: "记录不存在" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  if (action === "seat-map") {
    const parsed = seatMapSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
        { status: 400 },
      );
    }
    await updateSeatMap(meeting.id, parsed.data);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });
}
