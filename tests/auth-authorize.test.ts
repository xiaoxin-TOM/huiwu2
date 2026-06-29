import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { authorizeCredentials } from "@/lib/auth";

const TEST_EMAIL = "authorize-test@example.com";
const TEST_PASSWORD = "secret123";
let userId: string;

beforeAll(async () => {
  const u = await prisma.user.create({
    data: {
      name: "授权测试用户",
      email: TEST_EMAIL,
      passwordHash: await hashPassword(TEST_PASSWORD),
      role: "USER",
    },
  });
  userId = u.id;
});

afterAll(async () => {
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("authorizeCredentials", () => {
  it("(a) 正确邮箱+密码 → 返回含 role 的对象", async () => {
    const result = await authorizeCredentials(TEST_EMAIL, TEST_PASSWORD);
    expect(result).not.toBeNull();
    expect(result?.email).toBe(TEST_EMAIL);
    expect(result?.role).toBe("USER");
    expect(result?.id).toBeTruthy();
  });

  it("(b) 正确邮箱+错误密码 → null", async () => {
    const result = await authorizeCredentials(TEST_EMAIL, "wrongpassword");
    expect(result).toBeNull();
  });

  it("(c) 不存在的邮箱 → null", async () => {
    const result = await authorizeCredentials("nobody@example.com", TEST_PASSWORD);
    expect(result).toBeNull();
  });

  it("(d) 缺少邮箱 → null", async () => {
    const result = await authorizeCredentials(undefined, TEST_PASSWORD);
    expect(result).toBeNull();
  });

  it("(d) 缺少密码 → null", async () => {
    const result = await authorizeCredentials(TEST_EMAIL, undefined);
    expect(result).toBeNull();
  });
});
