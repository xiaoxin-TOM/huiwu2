import { afterAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: "dbtest@example.com" } });
  await prisma.$disconnect();
});

test("可创建并读取 User", async () => {
  const u = await prisma.user.create({
    data: { name: "测试", email: "dbtest@example.com", passwordHash: "x" },
  });
  const found = await prisma.user.findUnique({ where: { id: u.id } });
  expect(found?.email).toBe("dbtest@example.com");
  expect(found?.role).toBe("USER");
});
