import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { RegistrationInput, ReceptionInput } from "@/lib/validation";

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
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) throw new Error("NO_DEFAULT_MEETING");
  if (meeting.requirePassword && (input.password ?? "") !== meeting.registrationPassword) {
    throw new Error("INVALID_PASSWORD");
  }
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

export const REGISTRATIONS_PAGE_SIZE = 20;

export type RegistrationBucket = "REGISTERED" | "UNREGISTERED";

export type RegistrationListQuery = {
  typeId?: string;
  organization?: string;
  page?: number;
  bucket?: RegistrationBucket;
};

export async function listRegistrationsPaged(meetingId: string, query: RegistrationListQuery = {}) {
  const where: Prisma.RegistrationWhereInput = { meetingId };
  if (query.typeId) where.typeId = query.typeId;
  if (query.organization?.trim()) {
    where.organization = { contains: query.organization.trim(), mode: "insensitive" };
  }
  if (query.bucket === "REGISTERED") {
    where.status = "APPROVED";
  } else if (query.bucket === "UNREGISTERED") {
    where.status = { in: ["PENDING", "REJECTED"] };
  }
  const page = Math.max(1, query.page ?? 1);
  const take = REGISTRATIONS_PAGE_SIZE;
  const skip = (page - 1) * take;
  const [items, total] = await Promise.all([
    prisma.registration.findMany({
      where,
      include: { user: true, type: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.registration.count({ where }),
  ]);
  return { items, total, page, pageSize: take };
}

export async function batchReviewRegistrations(
  meetingId: string,
  ids: string[],
  decision: "APPROVED" | "REJECTED",
) {
  const limited = [...new Set(ids)].slice(0, REGISTRATIONS_PAGE_SIZE);
  if (limited.length === 0) return 0;
  const result = await prisma.registration.updateMany({
    where: { id: { in: limited }, meetingId },
    data: { status: decision },
  });
  return result.count;
}

export type RegistrationFilters = {
  status?: "ALL" | "PENDING" | "APPROVED" | "REJECTED";
  typeId?: "ALL" | string;
  q?: string;
};

export function listRegistrationsWithReception(meetingId: string, filters: RegistrationFilters = {}) {
  const where: { meetingId: string; status?: string; typeId?: string; fullName?: { contains: string; mode: "insensitive" } } = { meetingId };
  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status;
  }
  if (filters.typeId && filters.typeId !== "ALL") {
    where.typeId = filters.typeId;
  }
  if (filters.q?.trim()) {
    where.fullName = { contains: filters.q.trim(), mode: "insensitive" };
  }
  return prisma.registration.findMany({
    where,
    include: { user: true, type: true, reception: true },
    orderBy: [{ type: { name: "asc" } }, { createdAt: "desc" }],
  });
}

export function getRegistrationWithReception(id: string) {
  return prisma.registration.findUnique({
    where: { id },
    include: { user: true, type: true, reception: true },
  });
}

export function upsertRegistrationReception(registrationId: string, input: ReceptionInput) {
  return prisma.registrationReception.upsert({
    where: { registrationId },
    create: { registrationId, ...input },
    update: { ...input },
  });
}

export function getRegistrationReceptionById(id: string) {
  return prisma.registrationReception.findUnique({ where: { id }, include: { registration: true } });
}

export function updateRegistrationReception(id: string, input: ReceptionInput) {
  return prisma.registrationReception.update({ where: { id }, data: { ...input } });
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

export function listRegistrationTypes() {
  return prisma.registrationType.findMany({ orderBy: { fee: "asc" } });
}

export async function createRegistrationType(data: { name: string; fee: number; description?: string }) {
  const fee = Math.max(0, data.fee);
  const duplicate = await prisma.registrationType.findFirst({ where: { fee } });
  if (duplicate) throw new Error("DUPLICATE_IDENTITY_CODE");
  return prisma.registrationType.create({
    data: {
      name: data.name.trim(),
      fee,
      description: data.description?.trim() ?? "",
    },
  });
}

export async function updateRegistrationType(id: string, data: { name: string; fee: number; description?: string }) {
  const fee = Math.max(0, data.fee);
  const duplicate = await prisma.registrationType.findFirst({ where: { fee, NOT: { id } } });
  if (duplicate) throw new Error("DUPLICATE_IDENTITY_CODE");
  return prisma.registrationType.update({
    where: { id },
    data: {
      name: data.name.trim(),
      fee,
      description: data.description?.trim() ?? "",
    },
  });
}

export function deleteRegistrationType(id: string) {
  return prisma.registrationType.delete({ where: { id } });
}

export function countRegistrationsByType(typeId: string) {
  return prisma.registration.count({ where: { typeId } });
}

export async function transferRegistrationsToType(fromTypeId: string, toTypeId: string) {
  await prisma.registration.updateMany({
    where: { typeId: fromTypeId },
    data: { typeId: toTypeId },
  });
}

export async function deleteRegistrationTypeWithTransfer(id: string, targetTypeId?: string) {
  await prisma.$transaction(async (tx) => {
    if (targetTypeId) {
      await tx.registration.updateMany({
        where: { typeId: id },
        data: { typeId: targetTypeId },
      });
    }
    await tx.registrationType.delete({ where: { id } });
  });
}
