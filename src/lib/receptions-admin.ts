import type { Prisma } from "@prisma/client";
import type { ReceptionTarget } from "@/types/reception";
import { prisma } from "@/lib/prisma";
import {
  computeReceptionPatch,
  type ReceptionBulkMode,
  type ReceptionBulkValues,
} from "@/lib/reception-bulk";

export type { ReceptionTarget } from "@/types/reception";

export type ReceptionBulkResult = {
  /** 新建了接待记录的人数 */
  created: number;
  /** 更新了已有接待记录的人数 */
  updated: number;
  /** 按当前写入方式算下来无需改动的人数 */
  unchanged: number;
  /** 不属于当前会议或已不存在，被拒绝处理的人数 */
  rejected: number;
};

/**
 * 批量写入接待信息。只处理确实属于 meetingId 的嘉宾/报名人员，
 * 越界或已删除的 id 一律计入 rejected 而非静默写入。
 */
export async function bulkApplyReception(
  meetingId: string,
  targets: ReceptionTarget[],
  fields: ReceptionBulkValues,
  mode: ReceptionBulkMode,
): Promise<ReceptionBulkResult> {
  const guestIds = [...new Set(targets.filter((t) => t.kind === "guest").map((t) => t.id))];
  const registrationIds = [...new Set(targets.filter((t) => t.kind === "registration").map((t) => t.id))];

  const [guests, registrations] = await Promise.all([
    guestIds.length
      ? prisma.guest.findMany({
          where: { id: { in: guestIds }, meetingId },
          select: { id: true, reception: true },
        })
      : Promise.resolve([]),
    registrationIds.length
      ? prisma.registration.findMany({
          where: { id: { in: registrationIds }, meetingId },
          select: { id: true, reception: true },
        })
      : Promise.resolve([]),
  ]);

  // PrismaPromise 是惰性的，收集完一次性提交，保证批量写入原子生效
  const ops: Prisma.PrismaPromise<unknown>[] = [];
  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const g of guests) {
    const patch = computeReceptionPatch(g.reception, fields, mode);
    if (Object.keys(patch).length === 0) {
      unchanged += 1;
      continue;
    }
    if (g.reception) {
      updated += 1;
      ops.push(prisma.guestReception.update({ where: { guestId: g.id }, data: patch }));
    } else {
      created += 1;
      ops.push(prisma.guestReception.create({ data: { guestId: g.id, ...patch } }));
    }
  }

  for (const r of registrations) {
    const patch = computeReceptionPatch(r.reception, fields, mode);
    if (Object.keys(patch).length === 0) {
      unchanged += 1;
      continue;
    }
    if (r.reception) {
      updated += 1;
      ops.push(prisma.registrationReception.update({ where: { registrationId: r.id }, data: patch }));
    } else {
      created += 1;
      ops.push(prisma.registrationReception.create({ data: { registrationId: r.id, ...patch } }));
    }
  }

  if (ops.length > 0) {
    await prisma.$transaction(ops);
  }

  const rejected = guestIds.length + registrationIds.length - guests.length - registrations.length;
  return { created, updated, unchanged, rejected };
}

/** 定位一条接待记录所属的会议，供单条更新接口做隔离校验。 */
export async function findReceptionOwner(
  receptionId: string,
): Promise<{ kind: "guest" | "registration"; meetingId: string } | null> {
  const guestReception = await prisma.guestReception.findUnique({
    where: { id: receptionId },
    select: { guest: { select: { meetingId: true } } },
  });
  if (guestReception) return { kind: "guest", meetingId: guestReception.guest.meetingId };

  const regReception = await prisma.registrationReception.findUnique({
    where: { id: receptionId },
    select: { registration: { select: { meetingId: true } } },
  });
  if (regReception) return { kind: "registration", meetingId: regReception.registration.meetingId };

  return null;
}
