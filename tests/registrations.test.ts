import { afterAll, beforeAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createRegistration,
  getUserRegistration,
  reviewRegistration,
  createRegistrationType,
  updateRegistrationType,
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

test("开启报名密码后：密码错误/为空抛 INVALID_PASSWORD，密码正确才能报名成功", async () => {
  const u3 = await prisma.user.create({
    data: { name: "报名测试3", email: "regtest3@example.com", passwordHash: "x", isActive: true },
  });
  const m3 = await prisma.meeting.create({
    data: { title: "测试会议3", requirePassword: true, registrationPassword: "secret123" },
  });
  try {
    await expect(
      createRegistration(u3.id, m3.id, {
        typeId, fullName: "李四", organization: "", title: "", phone: "",
      }),
    ).rejects.toThrow("INVALID_PASSWORD");

    await expect(
      createRegistration(u3.id, m3.id, {
        typeId, fullName: "李四", organization: "", title: "", phone: "", password: "wrong",
      }),
    ).rejects.toThrow("INVALID_PASSWORD");

    const reg = await createRegistration(u3.id, m3.id, {
      typeId, fullName: "李四", organization: "", title: "", phone: "", password: "secret123",
    });
    expect(reg.status).toBe("PENDING");
  } finally {
    await prisma.registration.deleteMany({ where: { userId: u3.id } });
    await prisma.user.delete({ where: { id: u3.id } }).catch(() => {});
    await prisma.meeting.delete({ where: { id: m3.id } }).catch(() => {});
  }
});

test("参会类型身份编号(fee)不可重复：新建/更新为重复编号均抛 DUPLICATE_IDENTITY_CODE", async () => {
  const created = await createRegistrationType({ name: "编号测试类型", fee: 8801, description: "" });
  try {
    await expect(
      createRegistrationType({ name: "另一个类型", fee: 8801, description: "" }),
    ).rejects.toThrow("DUPLICATE_IDENTITY_CODE");

    const another = await createRegistrationType({ name: "编号测试类型2", fee: 8802, description: "" });
    try {
      await expect(
        updateRegistrationType(another.id, { name: another.name, fee: 8801, description: "" }),
      ).rejects.toThrow("DUPLICATE_IDENTITY_CODE");

      // 更新为自身原有编号应当成功（不与自己冲突）
      const updated = await updateRegistrationType(another.id, { name: another.name, fee: 8802, description: "改一下" });
      expect(updated.description).toBe("改一下");
    } finally {
      await prisma.registrationType.delete({ where: { id: another.id } }).catch(() => {});
    }
  } finally {
    await prisma.registrationType.delete({ where: { id: created.id } }).catch(() => {});
  }
});
