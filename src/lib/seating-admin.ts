import { prisma } from "@/lib/prisma";
import type { SeatTableLike, SeatAssignmentLike } from "@/lib/seating";
import type { SeatTableInput } from "@/lib/validation";

function loadTables(meetingId: string) {
  return prisma.seatTable.findMany({
    where: { meetingId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      assignments: {
        include: {
          registration: { select: { id: true, fullName: true, organization: true } },
          guest: { select: { id: true, name: true, company: true } },
        },
        orderBy: [{ seatNo: "asc" }, { createdAt: "asc" }],
      },
    },
  });
}

type RawTable = Awaited<ReturnType<typeof loadTables>>[number];

export type SeatAssignmentView = SeatAssignmentLike & {
  org: string;
  kind: "guest" | "registration" | "unknown";
};

/** 用参数化的 SeatTableLike 而非交叉类型——交叉会让 assignments 的元素类型退化 */
export type SeatTableView = SeatTableLike<SeatAssignmentView>;

function toView(t: RawTable): SeatTableView {
  return {
    id: t.id,
    name: t.name,
    capacity: t.capacity,
    area: t.area,
    assignments: t.assignments.map((a) => ({
      id: a.id,
      seatTableId: a.seatTableId,
      registrationId: a.registrationId,
      guestId: a.guestId,
      seatNo: a.seatNo,
      name: a.registration?.fullName ?? a.guest?.name ?? "（记录已删除）",
      org: a.registration?.organization ?? a.guest?.company ?? "",
      kind: a.registrationId ? "registration" : a.guestId ? "guest" : "unknown",
    })),
  };
}

export async function listSeatTables(meetingId: string): Promise<SeatTableView[]> {
  return (await loadTables(meetingId)).map(toView);
}

export function createSeatTable(meetingId: string, input: SeatTableInput) {
  return prisma.seatTable.create({
    data: {
      meetingId,
      name: input.name,
      capacity: input.capacity,
      area: input.area,
      sortOrder: input.sortOrder,
    },
  });
}

export function updateSeatTable(id: string, input: SeatTableInput) {
  return prisma.seatTable.update({
    where: { id },
    data: {
      name: input.name,
      capacity: input.capacity,
      area: input.area,
      sortOrder: input.sortOrder,
    },
  });
}

export function getSeatTable(id: string) {
  return prisma.seatTable.findUnique({ where: { id } });
}

export function deleteSeatTable(id: string) {
  return prisma.seatTable.delete({ where: { id } });
}

export type AssignOutcome = "OK" | "ALREADY_AT_TABLE" | "MOVED" | "NOT_FOUND";

/**
 * 把某人排到某桌。
 *
 * 一人只应有一个座位，因此先清掉其在本会议其他桌的排座再写入——
 * 「换桌」是最常见的操作，让调用方先删后加容易漏。
 */
export async function assignSeat(params: {
  seatTableId: string;
  meetingId: string;
  registrationId?: string | null;
  guestId?: string | null;
  seatNo?: number | null;
}): Promise<AssignOutcome> {
  const { seatTableId, meetingId } = params;
  const registrationId = params.registrationId || null;
  const guestId = params.guestId || null;
  if (!registrationId && !guestId) return "NOT_FOUND";

  // 校验被排的人确实属于该会议，避免把别的会议的人排进来
  if (registrationId) {
    const reg = await prisma.registration.findFirst({
      where: { id: registrationId, meetingId },
      select: { id: true },
    });
    if (!reg) return "NOT_FOUND";
  }
  if (guestId) {
    const guest = await prisma.guest.findFirst({ where: { id: guestId, meetingId }, select: { id: true } });
    if (!guest) return "NOT_FOUND";
  }

  const where = registrationId ? { registrationId } : { guestId };
  const existing = await prisma.seatAssignment.findFirst({
    where: { ...where, seatTable: { meetingId } },
    select: { id: true, seatTableId: true },
  });

  if (existing?.seatTableId === seatTableId) {
    // 已在本桌，只更新座次
    await prisma.seatAssignment.update({
      where: { id: existing.id },
      data: { seatNo: params.seatNo ?? null },
    });
    return "ALREADY_AT_TABLE";
  }

  await prisma.$transaction(async (tx) => {
    if (existing) await tx.seatAssignment.delete({ where: { id: existing.id } });
    await tx.seatAssignment.create({
      data: { seatTableId, registrationId, guestId, seatNo: params.seatNo ?? null },
    });
  });

  return existing ? "MOVED" : "OK";
}

export async function removeSeatAssignment(id: string, meetingId: string): Promise<boolean> {
  const row = await prisma.seatAssignment.findFirst({
    where: { id, seatTable: { meetingId } },
    select: { id: true },
  });
  if (!row) return false;
  await prisma.seatAssignment.delete({ where: { id: row.id } });
  return true;
}

/** 尚未排座的嘉宾与报名人员 */
export async function listUnseated(meetingId: string) {
  const [guests, registrations] = await Promise.all([
    prisma.guest.findMany({
      where: { meetingId, seatAssignments: { none: { seatTable: { meetingId } } } },
      select: { id: true, name: true, company: true },
      orderBy: { name: "asc" },
    }),
    prisma.registration.findMany({
      where: {
        meetingId,
        status: "APPROVED",
        seatAssignments: { none: { seatTable: { meetingId } } },
      },
      select: { id: true, fullName: true, organization: true },
      orderBy: { fullName: "asc" },
    }),
  ]);
  return [
    ...guests.map((g) => ({ kind: "guest" as const, id: g.id, name: g.name, org: g.company })),
    ...registrations.map((r) => ({
      kind: "registration" as const,
      id: r.id,
      name: r.fullName,
      org: r.organization,
    })),
  ];
}

export function getSeatMap(meetingId: string) {
  return prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { seatMapUrl: true, seatMapNote: true },
  });
}

export function updateSeatMap(meetingId: string, data: { seatMapUrl: string; seatMapNote: string }) {
  return prisma.meeting.update({
    where: { id: meetingId },
    data: { seatMapUrl: data.seatMapUrl || null, seatMapNote: data.seatMapNote },
  });
}
