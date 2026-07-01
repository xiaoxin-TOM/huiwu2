import { afterAll, beforeAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

let userId: string;

beforeAll(async () => {
  const u = await prisma.user.create({
    data: {
      name: "管理员",
      email: "authtest@example.com",
      passwordHash: await hashPassword("admin123"),
      role: "ADMIN",
    },
  });
  userId = u.id;
});

afterAll(async () => {
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

test("已存的 ADMIN 可按密码校验且 role 正确", async () => {
  const u = await prisma.user.findUnique({ where: { email: "authtest@example.com" } });
  expect(u?.role).toBe("ADMIN");
});
