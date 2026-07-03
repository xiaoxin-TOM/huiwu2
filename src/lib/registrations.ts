import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { RegistrationInput } from "@/lib/validation";

export async function createRegistration(userId: string, input: RegistrationInput) {
  const existing = await prisma.registration.findFirst({ where: { userId } });
  if (existing) throw new Error("ALREADY_REGISTERED");
  const type = await prisma.registrationType.findUnique({ where: { id: input.typeId } });
  if (!type) throw new Error("TYPE_NOT_FOUND");
  try {
    return await prisma.registration.create({
      data: {
        userId,
        typeId: input.typeId,
        fullName: input.fullName,
        organization: input.organization ?? "",
        title: input.title ?? "",
        phone: input.phone ?? "",
        token: randomUUID().replace(/-/g, ""),
      },
    });
  } catch (e) {
    // 并发兜底:userId 唯一约束冲突(findFirst 与 create 之间的竞态)
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error("ALREADY_REGISTERED");
    }
    throw e;
  }
}

export function getUserRegistration(userId: string) {
  return prisma.registration.findFirst({
    where: { userId },
    include: { type: true },
  });
}

export function listRegistrations() {
  return prisma.registration.findMany({
    include: { user: true, type: true },
    orderBy: { createdAt: "desc" },
  });
}

export function reviewRegistration(id: string, decision: "APPROVED" | "REJECTED") {
  return prisma.registration.update({ where: { id }, data: { status: decision } });
}

/** 通过 token 查找报名记录 */
export function findRegistrationByToken(token: string) {
  return prisma.registration.findUnique({
    where: { token },
    include: { user: true, type: true },
  });
}

/** 搜索可签到的报名记录（姓名、手机、邮箱、单位） */
export function searchRegistrations(query: string) {
  const q = query.trim();
  if (!q) return [];
  const where: Prisma.RegistrationWhereInput = {
    OR: [
      { fullName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { organization: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ],
  };
  return prisma.registration.findMany({
    where,
    include: { user: true, type: true },
    orderBy: { fullName: "asc" },
    take: 20,
  });
}

/** 记录签到（幂等）：返回 { first, registration } */
export async function recordCheckin(
  registrationId: string,
  options: { method: "SCAN" | "MANUAL" | "SELF"; byUserId?: string },
) {
  const reg = await prisma.registration.findUnique({ where: { id: registrationId } });
  if (!reg) throw new Error("NOT_FOUND");

  const first = !reg.checkedIn;
  await prisma.$transaction(async (tx) => {
    await tx.checkinLog.create({
      data: {
        registrationId,
        byUserId: options.byUserId ?? null,
        method: options.method,
      },
    });
    if (first) {
      await tx.registration.update({
        where: { id: registrationId },
        data: { checkedIn: true, checkedInAt: new Date() },
      });
    }
  });

  return { first, registration: reg };
}

/** 签到统计 */
export async function getCheckinStats() {
  const [total, checkedIn] = await Promise.all([
    prisma.registration.count(),
    prisma.registration.count({ where: { checkedIn: true } }),
  ]);
  return { total, checkedIn, unchecked: total - checkedIn };
}

/** 最近签到记录 */
export function listRecentCheckins(take = 20) {
  return prisma.checkinLog.findMany({
    orderBy: { checkedAt: "desc" },
    take,
    include: { registration: { include: { user: true, type: true } } },
  });
}
