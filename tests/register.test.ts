import { afterAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import { createUser } from "@/lib/users";
import { verifyPassword } from "@/lib/password";

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: "reg@example.com" } });
  await prisma.$disconnect();
});

test("createUser 写库并哈希密码,重复邮箱报错", async () => {
  const { id } = await createUser({
    name: "张三",
    email: "reg@example.com",
    password: "pass1234",
  });
  const u = await prisma.user.findUnique({ where: { id } });
  expect(u?.name).toBe("张三");
  expect(await verifyPassword("pass1234", u!.passwordHash)).toBe(true);

  await expect(
    createUser({ name: "李四", email: "reg@example.com", password: "x" })
  ).rejects.toThrow("EMAIL_TAKEN");
});
