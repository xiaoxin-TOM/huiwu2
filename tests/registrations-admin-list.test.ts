import { afterAll, beforeAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createRegistration,
  listRegistrationsPaged,
  batchReviewRegistrations,
} from "@/lib/registrations";

const userIds: string[] = [];
let typeAId: string;
let typeBId: string;
let meetingId: string;
let otherMeetingId: string;

beforeAll(async () => {
  const t1 = await prisma.registrationType.create({ data: { name: "报审类型A", fee: 9101 } });
  typeAId = t1.id;
  const t2 = await prisma.registrationType.create({ data: { name: "报审类型B", fee: 9102 } });
  typeBId = t2.id;
  const m = await prisma.meeting.create({ data: { title: "报审分页测试会议" } });
  meetingId = m.id;
  const m2 = await prisma.meeting.create({ data: { title: "报审分页测试会议-其他" } });
  otherMeetingId = m2.id;

  // 25 条数据，覆盖分页与筛选：typeA/单位甲 12 条，typeB/单位乙 13 条
  for (let i = 0; i < 25; i++) {
    const u = await prisma.user.create({
      data: { name: `报审用户${i}`, email: `regadmin${i}@example.com`, passwordHash: "x", isActive: true },
    });
    userIds.push(u.id);
    await createRegistration(u.id, meetingId, {
      typeId: i < 12 ? typeAId : typeBId,
      fullName: `报审用户${i}`,
      organization: i < 12 ? "单位甲" : "单位乙",
      title: "",
      phone: "",
    });
  }
  // 另一个会议下的一条报名，验证 meetingId 隔离
  const otherUser = await prisma.user.create({
    data: { name: "其他会议用户", email: "regadminother@example.com", passwordHash: "x", isActive: true },
  });
  userIds.push(otherUser.id);
  await createRegistration(otherUser.id, otherMeetingId, {
    typeId: typeAId, fullName: "其他会议用户", organization: "单位甲", title: "", phone: "",
  });
});

afterAll(async () => {
  await prisma.registration.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.meeting.deleteMany({ where: { id: { in: [meetingId, otherMeetingId] } } }).catch(() => {});
  await prisma.registrationType.deleteMany({ where: { id: { in: [typeAId, typeBId] } } }).catch(() => {});
  await prisma.$disconnect();
});

test("listRegistrationsPaged 每页最多 20 条，且不跨会议", async () => {
  const page1 = await listRegistrationsPaged(meetingId, { page: 1 });
  expect(page1.items).toHaveLength(20);
  expect(page1.total).toBe(25);
  expect(page1.pageSize).toBe(20);

  const page2 = await listRegistrationsPaged(meetingId, { page: 2 });
  expect(page2.items).toHaveLength(5);

  const allIds = new Set([...page1.items, ...page2.items].map((r) => r.id));
  expect(allIds.size).toBe(25);
  expect([...allIds].every((id) => id)).toBe(true);
});

test("listRegistrationsPaged 支持按类型/单位筛选", async () => {
  const byType = await listRegistrationsPaged(meetingId, { typeId: typeAId, page: 1 });
  expect(byType.total).toBe(12);
  expect(byType.items.every((r) => r.typeId === typeAId)).toBe(true);

  const byOrg = await listRegistrationsPaged(meetingId, { organization: "单位乙", page: 1 });
  expect(byOrg.total).toBe(13);
  expect(byOrg.items.every((r) => r.organization === "单位乙")).toBe(true);
});

test("batchReviewRegistrations 单次最多处理 20 条，且仅影响指定会议", async () => {
  const page1 = await listRegistrationsPaged(meetingId, { page: 1 });
  const ids = page1.items.map((r) => r.id); // 20 条

  const count = await batchReviewRegistrations(meetingId, ids, "APPROVED");
  expect(count).toBe(20);

  const refreshed = await listRegistrationsPaged(meetingId, { page: 1 });
  expect(refreshed.items.every((r) => r.status === "APPROVED")).toBe(true);

  // 传入超过 20 条 id 时只处理前 20 条
  const page2 = await listRegistrationsPaged(meetingId, { page: 2 });
  const moreThan20 = [...ids, ...page2.items.map((r) => r.id)];
  const count2 = await batchReviewRegistrations(meetingId, moreThan20, "REJECTED");
  expect(count2).toBeLessThanOrEqual(20);
});

test("listRegistrationsPaged 按 bucket 区分已报名(APPROVED)/未报名(PENDING+REJECTED)", async () => {
  const t = await prisma.registrationType.create({ data: { name: "报审bucket类型", fee: 9201 } });
  const m = await prisma.meeting.create({ data: { title: "报审bucket测试会议", requireApproval: true } });
  const localUserIds: string[] = [];
  try {
    const statuses = ["PENDING", "APPROVED", "REJECTED"] as const;
    for (const status of statuses) {
      const u = await prisma.user.create({
        data: { name: `bucket用户-${status}`, email: `bucket-${status}@example.com`, passwordHash: "x", isActive: true },
      });
      localUserIds.push(u.id);
      const reg = await createRegistration(u.id, m.id, {
        typeId: t.id, fullName: `bucket用户-${status}`, organization: "", title: "", phone: "",
      });
      if (status !== "PENDING") {
        await prisma.registration.update({ where: { id: reg.id }, data: { status } });
      }
    }

    const registered = await listRegistrationsPaged(m.id, { bucket: "REGISTERED" });
    expect(registered.total).toBe(1);
    expect(registered.items.every((r) => r.status === "APPROVED")).toBe(true);

    const unregistered = await listRegistrationsPaged(m.id, { bucket: "UNREGISTERED" });
    expect(unregistered.total).toBe(2);
    expect(unregistered.items.every((r) => r.status === "PENDING" || r.status === "REJECTED")).toBe(true);
  } finally {
    await prisma.registration.deleteMany({ where: { userId: { in: localUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: localUserIds } } });
    await prisma.meeting.delete({ where: { id: m.id } }).catch(() => {});
    await prisma.registrationType.delete({ where: { id: t.id } }).catch(() => {});
  }
});
