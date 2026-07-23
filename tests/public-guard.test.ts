import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Map()),
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { guardPublicAccess } from "@/lib/public-guard";

const mockedAuth = vi.mocked(auth);

let meetingRealNameId: string;
let meetingGuestId: string;
let userId: string;
let typeId: string;

beforeAll(async () => {
  const m1 = await prisma.meeting.create({ data: { title: "guard测试-实名会议", requireRealName: true } });
  meetingRealNameId = m1.id;
  const m2 = await prisma.meeting.create({ data: { title: "guard测试-游客会议", requireRealName: false } });
  meetingGuestId = m2.id;
  const u = await prisma.user.create({
    data: { name: "guard测试用户", email: "guard-test@example.com", passwordHash: "x", isActive: true },
  });
  userId = u.id;
  const t = await prisma.registrationType.create({ data: { name: "guard测试类型", fee: 9301 } });
  typeId = t.id;
});

afterAll(async () => {
  await prisma.registration.deleteMany({ where: { userId } });
  await prisma.meeting.deleteMany({ where: { id: { in: [meetingRealNameId, meetingGuestId] } } });
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await prisma.registrationType.delete({ where: { id: typeId } }).catch(() => {});
  await prisma.$disconnect();
});

beforeEach(() => mockedAuth.mockReset());
afterEach(() => vi.restoreAllMocks());

test("未登录访问要求实名的会议会被重定向到登录页", async () => {
  mockedAuth.mockResolvedValue(null as never);
  await expect(guardPublicAccess(meetingRealNameId)).rejects.toThrow(/^REDIRECT:\/login/);
});

test("未登录访问不要求实名(游客模式)的会议直接放行", async () => {
  mockedAuth.mockResolvedValue(null as never);
  await expect(guardPublicAccess(meetingGuestId)).resolves.toBeUndefined();
});

test("已登录但未报名时仍会跳转到报名页(不受实名开关影响)", async () => {
  mockedAuth.mockResolvedValue({ user: { id: userId, role: "USER" } } as never);
  await expect(guardPublicAccess(meetingGuestId)).rejects.toThrow(`REDIRECT:/r/${meetingGuestId}`);
});

test("已登录且报名通过后可正常访问", async () => {
  await prisma.registration.create({
    data: {
      userId,
      meetingId: meetingRealNameId,
      typeId,
      fullName: "guard测试用户",
      status: "APPROVED",
      token: "guard-test-token",
    },
  });
  mockedAuth.mockResolvedValue({ user: { id: userId, role: "USER" } } as never);
  await expect(guardPublicAccess(meetingRealNameId)).resolves.toBeUndefined();
});
