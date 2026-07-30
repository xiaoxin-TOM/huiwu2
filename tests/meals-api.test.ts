import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/lib/auth";
import { POST as createApi } from "@/app/api/admin/meals/route";
import { POST as updateApi, DELETE as deleteApi } from "@/app/api/admin/meals/[id]/route";
import { POST as redeemApi } from "@/app/api/admin/meals/redeem/route";
import { redeemMeal, listMealSessions } from "@/lib/meals-admin";

const mockedAuth = vi.mocked(auth);

let adminId: string;
let otherAdminId: string;
let userVip: string;
let userNormal: string;
let meetingId: string;
let otherMeetingId: string;
let typeVip: string;
let typeNormal: string;
let regVipToken: string;
let regNormalToken: string;
let regVipId: string;

function jsonReq(url: string, body: unknown, meeting = meetingId) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: `admin_meeting_id=${meeting}` },
    body: JSON.stringify(body),
  });
}

async function createMeal(over: Record<string, unknown> = {}) {
  const res = await createApi(
    jsonReq("http://localhost/api/admin/meals", {
      day: "2026-08-12",
      slot: "LUNCH",
      name: "自助午餐",
      venue: "三楼",
      startTime: "12:00",
      endTime: "13:30",
      typeIds: [],
      isVisible: true,
      ...over,
    }),
  );
  return { res, data: await res.json().catch(() => ({})) };
}

beforeAll(async () => {
  for (const email of ["meal-admin@example.com", "meal-other@example.com", "meal-vip@example.com", "meal-normal@example.com"]) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      await prisma.registration.deleteMany({ where: { userId: u.id } });
      await prisma.meeting.deleteMany({ where: { ownerId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
  }
  const admin = await prisma.user.create({
    data: { name: "餐饮管理员", email: "meal-admin@example.com", passwordHash: "x", role: "ADMIN" },
  });
  adminId = admin.id;
  const other = await prisma.user.create({
    data: { name: "他人", email: "meal-other@example.com", passwordHash: "x", role: "ADMIN" },
  });
  otherAdminId = other.id;
  userVip = (await prisma.user.create({ data: { name: "VIP", email: "meal-vip@example.com", passwordHash: "x" } })).id;
  userNormal = (await prisma.user.create({ data: { name: "普通", email: "meal-normal@example.com", passwordHash: "x" } })).id;

  const m = await prisma.meeting.create({ data: { title: "用餐测试会议", ownerId: adminId } });
  meetingId = m.id;
  const om = await prisma.meeting.create({ data: { title: "他人会议", ownerId: otherAdminId } });
  otherMeetingId = om.id;

  const stamp = Date.now();
  typeVip = (await prisma.registrationType.create({ data: { name: `VIP-${stamp}`, fee: 0 } })).id;
  typeNormal = (await prisma.registrationType.create({ data: { name: `普通-${stamp}`, fee: 0 } })).id;

  const rv = await prisma.registration.create({
    data: { userId: userVip, meetingId, typeId: typeVip, fullName: "VIP 代表", status: "APPROVED" },
  });
  regVipToken = rv.token;
  regVipId = rv.id;
  const rn = await prisma.registration.create({
    data: { userId: userNormal, meetingId, typeId: typeNormal, fullName: "普通代表", status: "APPROVED" },
  });
  regNormalToken = rn.token;
});

beforeEach(async () => {
  mockedAuth.mockResolvedValue({ user: { id: adminId, role: "ADMIN" } } as never);
  await prisma.mealRedemption.deleteMany({});
  await prisma.mealSession.deleteMany({ where: { meetingId: { in: [meetingId, otherMeetingId] } } });
});

afterAll(async () => {
  await prisma.mealRedemption.deleteMany({});
  await prisma.mealSession.deleteMany({ where: { meetingId: { in: [meetingId, otherMeetingId] } } });
  await prisma.registration.deleteMany({ where: { meetingId } });
  await prisma.meeting.deleteMany({ where: { id: { in: [meetingId, otherMeetingId] } } });
  await prisma.registrationType.deleteMany({ where: { id: { in: [typeVip, typeNormal] } } });
  await prisma.user.deleteMany({ where: { id: { in: [adminId, otherAdminId, userVip, userNormal] } } });
  await prisma.$disconnect();
});

test("创建餐次并统计核销数", async () => {
  const { res, data } = await createMeal();
  expect(res.status).toBe(200);

  const list = await listMealSessions(meetingId);
  expect(list).toHaveLength(1);
  expect(list[0].id).toBe(data.id);
  expect(list[0].redeemed).toBe(0);
  expect(list[0].typeIds).toEqual([]);
});

test("同一天同一餐次不能重复创建", async () => {
  await createMeal();
  const { res } = await createMeal();
  expect(res.status).toBe(409);
});

test("核销成功，重复核销返回已领取而非再记一笔", async () => {
  const { data } = await createMeal();

  const first = await redeemApi(
    jsonReq("http://localhost/api/admin/meals/redeem", { mealSessionId: data.id, token: regVipToken }),
  );
  const firstBody = await first.json();
  expect(firstBody.status).toBe("OK");
  expect(firstBody.fullName).toBe("VIP 代表");

  const second = await redeemApi(
    jsonReq("http://localhost/api/admin/meals/redeem", { mealSessionId: data.id, token: regVipToken }),
  );
  const secondBody = await second.json();
  expect(secondBody.status).toBe("ALREADY");

  // 只应留下一条核销记录
  expect(await prisma.mealRedemption.count({ where: { mealSessionId: data.id } })).toBe(1);
});

test("并发核销同一人同一餐只落一条——唯一约束是根本保障", async () => {
  const { data } = await createMeal();

  const results = await Promise.all(
    Array.from({ length: 6 }, () => redeemMeal({ mealSessionId: data.id, token: regVipToken })),
  );
  const okCount = results.filter((r) => r.status === "OK").length;
  const alreadyCount = results.filter((r) => r.status === "ALREADY").length;

  expect(okCount).toBe(1);
  expect(alreadyCount).toBe(5);
  expect(await prisma.mealRedemption.count({ where: { mealSessionId: data.id } })).toBe(1);
});

test("限定参会类型时无资格者被拒，且不留核销记录", async () => {
  const { data } = await createMeal({ typeIds: [typeVip], name: "VIP 晚宴", slot: "DINNER" });

  const denied = await redeemApi(
    jsonReq("http://localhost/api/admin/meals/redeem", { mealSessionId: data.id, token: regNormalToken }),
  );
  const body = await denied.json();
  expect(body.status).toBe("NOT_ELIGIBLE");
  expect(await prisma.mealRedemption.count({ where: { mealSessionId: data.id } })).toBe(0);

  const allowed = await redeemApi(
    jsonReq("http://localhost/api/admin/meals/redeem", { mealSessionId: data.id, token: regVipToken }),
  );
  expect((await allowed.json()).status).toBe("OK");
});

test("typeIds 为空时所有参会类型都能核销", async () => {
  const { data } = await createMeal({ typeIds: [] });
  for (const token of [regVipToken, regNormalToken]) {
    const res = await redeemApi(
      jsonReq("http://localhost/api/admin/meals/redeem", { mealSessionId: data.id, token }),
    );
    expect((await res.json()).status).toBe("OK");
  }
  expect(await prisma.mealRedemption.count({ where: { mealSessionId: data.id } })).toBe(2);
});

test("其他会议的凭证被拒", async () => {
  const { data } = await createMeal();
  const outsideUser = await prisma.user.create({
    data: { name: "外人", email: `meal-out-${Date.now()}@example.com`, passwordHash: "x" },
  });
  const outsideReg = await prisma.registration.create({
    data: { userId: outsideUser.id, meetingId: otherMeetingId, typeId: typeVip, fullName: "外人", status: "APPROVED" },
  });

  const res = await redeemApi(
    jsonReq("http://localhost/api/admin/meals/redeem", { mealSessionId: data.id, token: outsideReg.token }),
  );
  expect(res.status).toBe(400);

  await prisma.registration.delete({ where: { id: outsideReg.id } });
  await prisma.user.delete({ where: { id: outsideUser.id } });
});

test("不存在的凭证返回 404", async () => {
  const { data } = await createMeal();
  const res = await redeemApi(
    jsonReq("http://localhost/api/admin/meals/redeem", { mealSessionId: data.id, token: "no-such-token" }),
  );
  expect(res.status).toBe(404);
});

test("其他会议的管理员不能改删本会议餐次", async () => {
  const { data } = await createMeal();
  mockedAuth.mockResolvedValue({ user: { id: otherAdminId, role: "ADMIN" } } as never);

  const upd = await updateApi(
    jsonReq("http://localhost", { day: "2026-08-13", slot: "LUNCH", typeIds: [], isVisible: true }),
    { params: Promise.resolve({ id: data.id }) },
  );
  expect(upd.status).toBe(403);

  const del = await deleteApi(new Request("http://localhost", { method: "DELETE" }), {
    params: Promise.resolve({ id: data.id }),
  });
  expect(del.status).toBe(403);
  expect(await prisma.mealSession.findUnique({ where: { id: data.id } })).not.toBeNull();
});

test("其他会议的管理员不能核销本会议餐次", async () => {
  const { data } = await createMeal();
  mockedAuth.mockResolvedValue({ user: { id: otherAdminId, role: "ADMIN" } } as never);
  const res = await redeemApi(
    jsonReq("http://localhost/api/admin/meals/redeem", { mealSessionId: data.id, token: regVipToken }, otherMeetingId),
  );
  expect(res.status).toBe(403);
});

test("非管理员一律拒绝", async () => {
  mockedAuth.mockResolvedValue({ user: { id: userVip, role: "USER" } } as never);
  expect((await createMeal()).res.status).toBe(403);
});

test("删除餐次会连带清掉其核销记录", async () => {
  const { data } = await createMeal();
  await redeemApi(jsonReq("http://localhost/api/admin/meals/redeem", { mealSessionId: data.id, token: regVipToken }));
  expect(await prisma.mealRedemption.count({ where: { registrationId: regVipId } })).toBe(1);

  const del = await deleteApi(new Request("http://localhost", { method: "DELETE" }), {
    params: Promise.resolve({ id: data.id }),
  });
  expect(del.status).toBe(200);
  expect(await prisma.mealRedemption.count({ where: { registrationId: regVipId } })).toBe(0);
});

test("日期必填", async () => {
  const { res } = await createMeal({ day: "" });
  expect(res.status).toBe(400);
});

test("非法餐次值被拒", async () => {
  const { res } = await createMeal({ slot: "MIDNIGHT" });
  expect(res.status).toBe(400);
});
