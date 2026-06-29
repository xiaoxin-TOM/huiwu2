import { expect, test } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

test("哈希后能校验通过,错误密码失败", async () => {
  const hash = await hashPassword("secret123");
  expect(hash).not.toBe("secret123");
  expect(await verifyPassword("secret123", hash)).toBe(true);
  expect(await verifyPassword("wrong", hash)).toBe(false);
});
