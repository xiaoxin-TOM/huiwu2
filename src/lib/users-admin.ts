import { prisma } from "@/lib/prisma";

export function listUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: "asc" } });
}

export function setUserRole(id: string, role: "USER" | "ADMIN") {
  return prisma.user.update({ where: { id }, data: { role } });
}
