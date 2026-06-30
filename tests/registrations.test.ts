import { afterAll, beforeAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createRegistration,
  getUserRegistration,
  reviewRegistration,
} from "@/lib/registrations";

let userId: string;
let typeId: string;

beforeAll(async () => {
  const u = await prisma.user.create({
    data: { name: "报名测试", email: "regtest@example.com", passwordHash: "x" },
  });
  userId = u.id;
  const t = await prisma.registrationType.create({ data: { name: "测试类型", fee: 100 } });
  typeId = t.id;
});

afterAll(async () => {
  await prisma.registration.deleteMany({ where: { userId } });
  await prisma.registrationType.delete({ where: { id: typeId } }).catch(() => {});
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await prisma.$disconnect();
});

test("创建报名→重复报名抛错→审核回显状态", async () => {
  const reg = await createRegistration(userId, {
    typeId, fullName: "张三", organization: "", title: "", phone: "",
  });
  expect(reg.status).toBe("PENDING");

  await expect(
    createRegistration(userId, { typeId, fullName: "张三", organization: "", title: "", phone: "" }),
  ).rejects.toThrow("ALREADY_REGISTERED");

  const mine = await getUserRegistration(userId);
  expect(mine?.type.name).toBe("测试类型");

  const reviewed = await reviewRegistration(reg.id, "APPROVED");
  expect(reviewed.status).toBe("APPROVED");
  expect((await getUserRegistration(userId))?.status).toBe("APPROVED");
});

test("参会类型不存在时抛 TYPE_NOT_FOUND", async () => {
  await expect(
    createRegistration("no-such-user", {
      typeId: "no-such-type", fullName: "x", organization: "", title: "", phone: "",
    }),
  ).rejects.toThrow("TYPE_NOT_FOUND");
});
