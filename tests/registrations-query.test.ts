import { afterAll, beforeAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createRegistration,
  listUserRegistrationsAcrossMeetings,
  searchRegistrationsAcrossMeetings,
} from "@/lib/registrations";

let userId: string;
let typeId: string;
let meetingAId: string;
let meetingBId: string;

beforeAll(async () => {
  const u = await prisma.user.create({
    data: { name: "跨会议查询", email: "cross@example.com", passwordHash: "x", isActive: true },
  });
  userId = u.id;
  const t = await prisma.registrationType.create({ data: { name: "普通参会", fee: 100 } });
  typeId = t.id;
  const ma = await prisma.meeting.create({ data: { title: "第一届测试大会" } });
  meetingAId = ma.id;
  const mb = await prisma.meeting.create({ data: { title: "第二届测试大会" } });
  meetingBId = mb.id;
});

afterAll(async () => {
  await prisma.registration.deleteMany({ where: { userId } });
  await prisma.meeting.deleteMany({ where: { id: { in: [meetingAId, meetingBId] } } }).catch(() => {});
  await prisma.registrationType.delete({ where: { id: typeId } }).catch(() => {});
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await prisma.$disconnect();
});

test("listUserRegistrationsAcrossMeetings 返回同一用户跨会议报名", async () => {
  await createRegistration(userId, meetingAId, {
    typeId,
    fullName: "张三",
    organization: "A单位",
    title: "",
    phone: "",
  });
  await createRegistration(userId, meetingBId, {
    typeId,
    fullName: "张三",
    organization: "B单位",
    title: "",
    phone: "",
  });

  const regs = await listUserRegistrationsAcrossMeetings(userId);
  expect(regs).toHaveLength(2);
  expect(regs.map((r) => r.meeting.title).sort()).toEqual(["第一届测试大会", "第二届测试大会"]);
});

test("searchRegistrationsAcrossMeetings 可跨会议搜索", async () => {
  const byName = await searchRegistrationsAcrossMeetings("张三");
  expect(byName.length).toBeGreaterThanOrEqual(2);

  const byMeeting = await searchRegistrationsAcrossMeetings("第一届测试大会");
  expect(byMeeting.some((r) => r.meetingId === meetingAId)).toBe(true);

  const empty = await searchRegistrationsAcrossMeetings("不存在的名字xyz");
  expect(empty).toHaveLength(0);
});
