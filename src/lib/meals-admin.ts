import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeTypeIds, isEligibleForMeal, type MealSessionLike } from "@/lib/meals";
import type { MealSessionInput } from "@/lib/validation";

function toLike(row: {
  id: string;
  day: string;
  slot: string;
  name: string;
  venue: string;
  startTime: string;
  endTime: string;
  typeIds: Prisma.JsonValue;
}): MealSessionLike {
  return { ...row, typeIds: normalizeTypeIds(row.typeIds) };
}

export async function listMealSessions(meetingId: string) {
  const rows = await prisma.mealSession.findMany({
    where: { meetingId },
    orderBy: [{ day: "asc" }, { sortOrder: "asc" }],
    include: { _count: { select: { redemptions: true } } },
  });
  return rows.map((r) => ({ ...toLike(r), isVisible: r.isVisible, redeemed: r._count.redemptions }));
}

export async function listVisibleMealSessions(meetingId: string) {
  const rows = await prisma.mealSession.findMany({
    where: { meetingId, isVisible: true },
    orderBy: [{ day: "asc" }, { sortOrder: "asc" }],
  });
  return rows.map(toLike);
}

export function createMealSession(meetingId: string, input: MealSessionInput) {
  return prisma.mealSession.create({
    data: {
      meetingId,
      day: input.day,
      slot: input.slot,
      name: input.name,
      venue: input.venue,
      startTime: input.startTime,
      endTime: input.endTime,
      typeIds: normalizeTypeIds(input.typeIds) as unknown as Prisma.InputJsonValue,
      isVisible: input.isVisible,
    },
  });
}

export function updateMealSession(id: string, input: MealSessionInput) {
  return prisma.mealSession.update({
    where: { id },
    data: {
      day: input.day,
      slot: input.slot,
      name: input.name,
      venue: input.venue,
      startTime: input.startTime,
      endTime: input.endTime,
      typeIds: normalizeTypeIds(input.typeIds) as unknown as Prisma.InputJsonValue,
      isVisible: input.isVisible,
    },
  });
}

export function getMealSession(id: string) {
  return prisma.mealSession.findUnique({ where: { id } });
}

export function deleteMealSession(id: string) {
  return prisma.mealSession.delete({ where: { id } });
}

export type RedeemOutcome =
  | { status: "OK"; mealName: string; fullName: string }
  | { status: "ALREADY"; mealName: string; fullName: string; redeemedAt: Date }
  | { status: "NOT_ELIGIBLE"; mealName: string; fullName: string }
  | { status: "NOT_FOUND" }
  | { status: "WRONG_MEETING" };

/**
 * 核销一份餐。
 *
 * 防重领靠 MealRedemption 的 @@unique([mealSessionId, registrationId])：
 * 并发扫码时"先查再写"必然漏，唯一冲突（P2002）才是可靠的判定。
 */
export async function redeemMeal(params: {
  mealSessionId: string;
  token: string;
  byUserId?: string;
}): Promise<RedeemOutcome> {
  const meal = await prisma.mealSession.findUnique({ where: { id: params.mealSessionId } });
  if (!meal) return { status: "NOT_FOUND" };

  const reg = await prisma.registration.findUnique({
    where: { token: params.token },
    select: { id: true, meetingId: true, fullName: true, typeId: true },
  });
  if (!reg) return { status: "NOT_FOUND" };

  const mealName = meal.name || meal.slot;
  if (reg.meetingId !== meal.meetingId) {
    return { status: "WRONG_MEETING" };
  }
  if (!isEligibleForMeal({ typeIds: normalizeTypeIds(meal.typeIds) }, reg.typeId)) {
    return { status: "NOT_ELIGIBLE", mealName, fullName: reg.fullName };
  }

  try {
    await prisma.mealRedemption.create({
      data: { mealSessionId: meal.id, registrationId: reg.id, byUserId: params.byUserId },
    });
    return { status: "OK", mealName, fullName: reg.fullName };
  } catch (error) {
    // P2002 = 唯一约束冲突，说明这一餐已经核销过
    if (typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002") {
      const existing = await prisma.mealRedemption.findUnique({
        where: { mealSessionId_registrationId: { mealSessionId: meal.id, registrationId: reg.id } },
      });
      return {
        status: "ALREADY",
        mealName,
        fullName: reg.fullName,
        redeemedAt: existing?.redeemedAt ?? new Date(),
      };
    }
    throw error;
  }
}

/** 某人已核销的餐次 id 集合 */
export async function listRedeemedMealIds(registrationId: string): Promise<string[]> {
  const rows = await prisma.mealRedemption.findMany({
    where: { registrationId },
    select: { mealSessionId: true },
  });
  return rows.map((r) => r.mealSessionId);
}

export function listMealRedemptions(mealSessionId: string) {
  return prisma.mealRedemption.findMany({
    where: { mealSessionId },
    include: { registration: { select: { fullName: true, organization: true, type: { select: { name: true } } } } },
    orderBy: { redeemedAt: "desc" },
  });
}
