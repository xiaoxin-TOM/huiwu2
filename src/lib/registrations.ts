import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { RegistrationInput } from "@/lib/validation";

export async function createRegistration(
  userId: string,
  meetingId: string,
  input: RegistrationInput,
  options?: { channelId?: string },
) {
  const existing = await prisma.registration.findUnique({
    where: { userId_meetingId: { userId, meetingId } },
  });
  if (existing) throw new Error("ALREADY_REGISTERED");
  const type = await prisma.registrationType.findUnique({ where: { id: input.typeId } });
  if (!type) throw new Error("TYPE_NOT_FOUND");
  try {
    return await prisma.registration.create({
      data: {
        userId,
        meetingId,
        typeId: input.typeId,
        channelId: options?.channelId,
        fullName: input.fullName,
        organization: input.organization ?? "",
        title: input.title ?? "",
        phone: input.phone ?? "",
        token: randomUUID().replace(/-/g, ""),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error("ALREADY_REGISTERED");
    }
    throw e;
  }
}

export function getUserRegistration(userId: string, meetingId: string) {
  return prisma.registration.findUnique({
    where: { userId_meetingId: { userId, meetingId } },
    include: { type: true },
  });
}

export function listUserRegistrationsAcrossMeetings(userId: string) {
  return prisma.registration.findMany({
    where: { userId },
    include: { meeting: true, type: true },
    orderBy: { createdAt: "desc" },
  });
}

export function searchRegistrationsAcrossMeetings(query: string) {
  const q = query.trim();
  if (!q) return [];
  const where: Prisma.RegistrationWhereInput = {
    OR: [
      { fullName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { organization: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { meeting: { title: { contains: q, mode: "insensitive" } } },
    ],
  };
  return prisma.registration.findMany({
    where,
    include: { user: true, meeting: true, type: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export function listRegistrations(meetingId: string) {
  return prisma.registration.findMany({
    where: { meetingId },
    include: { user: true, type: true },
    orderBy: { createdAt: "desc" },
  });
}

export function reviewRegistration(id: string, decision: "APPROVED" | "REJECTED") {
  return prisma.registration.update({ where: { id }, data: { status: decision } });
}

export function findRegistrationByToken(token: string) {
  return prisma.registration.findUnique({
    where: { token },
    include: { user: true, type: true, meeting: true },
  });
}

export function searchRegistrations(query: string, meetingId: string) {
  const q = query.trim();
  if (!q) return [];
  const where: Prisma.RegistrationWhereInput = {
    meetingId,
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

export async function getCheckinStats(meetingId: string) {
  const [total, checkedIn] = await Promise.all([
    prisma.registration.count({ where: { meetingId } }),
    prisma.registration.count({ where: { meetingId, checkedIn: true } }),
  ]);
  return { total, checkedIn, unchecked: total - checkedIn };
}

export function listRecentCheckins(meetingId: string, take = 20) {
  return prisma.checkinLog.findMany({
    where: { registration: { meetingId } },
    orderBy: { checkedAt: "desc" },
    take,
    include: { registration: { include: { user: true, type: true } } },
  });
}

export function listCheckinLogs(meetingId: string) {
  return prisma.checkinLog.findMany({
    where: { registration: { meetingId } },
    orderBy: { checkedAt: "desc" },
    include: { registration: { include: { user: true, type: true } } },
  });
}
