import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import type { AdminUserCreateInput, AdminUserUpdateInput } from "@/lib/validation";

export function listUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: "asc" } });
}

export function searchUsers(query: string) {
  const q = query.trim();
  if (!q) return listUsers();
  return prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { organization: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });
}

export function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(input: AdminUserCreateInput) {
  const exists = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });
  if (exists) throw new Error("EMAIL_EXISTS");
  return prisma.user.create({
    data: {
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      passwordHash: await hashPassword(input.password),
      role: input.role,
      isActive: input.isActive,
    },
  });
}

export async function updateUser(id: string, input: AdminUserUpdateInput) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new Error("NOT_FOUND");
  const duplicate = await prisma.user.findFirst({
    where: { email: input.email.toLowerCase().trim(), NOT: { id } },
  });
  if (duplicate) throw new Error("EMAIL_EXISTS");
  const data: Parameters<typeof prisma.user.update>[0]["data"] = {
    name: input.name.trim(),
    email: input.email.toLowerCase().trim(),
    role: input.role,
    isActive: input.isActive,
  };
  if (input.password && input.password.length > 0) {
    data.passwordHash = await hashPassword(input.password);
  }
  return prisma.user.update({ where: { id }, data });
}

export function setUserRole(id: string, role: "USER" | "ADMIN") {
  return prisma.user.update({ where: { id }, data: { role } });
}

export async function resetUserPassword(id: string, plainPassword = "111111") {
  return prisma.user.update({
    where: { id },
    data: { passwordHash: await hashPassword(plainPassword) },
  });
}

export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}
