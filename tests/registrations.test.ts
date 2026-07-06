import { afterAll, beforeAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createRegistration,
  getUserRegistration,
  reviewRegistration,
} from "@/lib/registrations";

let userId: string;
let typeId: string;
let meetingId: string;

beforeAll(async () => {
  const u = await prisma.user.create({
    data: { name: "报名测试", email: "regtest@example.com", passwordHash: "x", isActive: true },
  });
  userId = u.id;
  const t = await prisma.registrationType.create({ data: { name: "测试类型", fee: 100 } });
  typeId = t.id;
  const m = await prisma.meeting.create({ data: { title: "测试会议" } });
  meetingId = m.id;
});

afterAll(async () => {
  await prisma.registration.deleteMany({ where: { userId } });
  await prisma.meeting.delete({ where: { id: meetingId } }).catch(() => {});
  await prisma.registrationType.delete({ where: { id: typeId } }).catch(() => {});
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await prisma.$disconnect();
});

test("创建报名→重复报名抛错→审核回显状态", async () => {
  const reg = await createRegistration(userId, meetingId, {
    typeId, fullName: "张三", organization: "", title: "", phone: "",
  });
  expect(reg.status).toBe("PENDING");

  await expect(
    createRegistration(userId, meetingId, { typeId, fullName: "张三", organization: "", title: "", phone: "" }),
  ).rejects.toThrow("ALREADY_REGISTERED");

  const mine = await getUserRegistration(userId, meetingId);
  expect(mine?.type.name).toBe("测试类型");

  const reviewed = await reviewRegistration(reg.id, "APPROVED");
  expect(reviewed.status).toBe("APPROVED");
  expect((await getUserRegistration(userId, meetingId))?.status).toBe("APPROVED");
});

test("参会类型不存在时抛 TYPE_NOT_FOUND", async () => {
  const u2 = await prisma.user.create({
    data: { name: "报名测试2", email: "regtest2@example.com", passwordHash: "x", isActive: true },
  });
  const m2 = await prisma.meeting.create({ data: { title: "测试会议2" } });
  try {
    await expect(
      createRegistration(u2.id, m2.id, {
        typeId: "no-such-type", fullName: "x", organization: "", title: "", phone: "",
      }),
    ).rejects.toThrow("TYPE_NOT_FOUND");
  } finally {
    await prisma.user.delete({ where: { id: u2.id } }).catch(() => {});
    await prisma.meeting.delete({ where: { id: m2.id } }).catch(() => {});
  }
});
