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
