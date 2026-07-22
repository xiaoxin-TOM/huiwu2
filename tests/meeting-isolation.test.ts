import { afterAll, beforeAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import { canAccessMeeting, listMeetingsForUser } from "@/lib/meetings";
import { authorizeUserForMeeting, revokeMeetingStaff, listMeetingStaff } from "@/lib/meeting-staff";

let ownerId: string;
let staffId: string;
let strangerId: string;
let ownedMeetingId: string;
let legacyMeetingId: string;
let othersMeetingId: string;

beforeAll(async () => {
  const owner = await prisma.user.create({
    data: { name: "会议归属者", email: "iso-owner@example.com", passwordHash: "x", role: "ADMIN", isActive: true },
  });
  ownerId = owner.id;
  const staff = await prisma.user.create({
    data: { name: "被授权者", email: "iso-staff@example.com", passwordHash: "x", role: "USER", isActive: true },
  });
  staffId = staff.id;
  const stranger = await prisma.user.create({
    data: { name: "无关管理员", email: "iso-stranger@example.com", passwordHash: "x", role: "ADMIN", isActive: true },
  });
  strangerId = stranger.id;

  const owned = await prisma.meeting.create({ data: { title: "隔离测试-自有会议", ownerId } });
  ownedMeetingId = owned.id;
  const legacy = await prisma.meeting.create({ data: { title: "隔离测试-遗留会议(无归属)" } });
  legacyMeetingId = legacy.id;
  const others = await prisma.meeting.create({ data: { title: "隔离测试-他人会议", ownerId: strangerId } });
  othersMeetingId = others.id;
});

afterAll(async () => {
  await prisma.meetingStaff.deleteMany({ where: { meetingId: { in: [ownedMeetingId, othersMeetingId] } } });
  await prisma.meeting.deleteMany({ where: { id: { in: [ownedMeetingId, legacyMeetingId, othersMeetingId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [ownerId, staffId, strangerId] } } });
  await prisma.$disconnect();
});

test("canAccessMeeting：owner 可访问自己创建的会议，无归属会议对所有人可见，他人会议不可访问", async () => {
  expect(await canAccessMeeting(ownerId, ownedMeetingId)).toBe(true);
  expect(await canAccessMeeting(ownerId, legacyMeetingId)).toBe(true);
  expect(await canAccessMeeting(ownerId, othersMeetingId)).toBe(false);
  expect(await canAccessMeeting("不存在的用户id", "不存在的会议id")).toBe(false);
});

test("listMeetingsForUser：只返回自己创建的、无归属的和被授权的会议", async () => {
  const list = await listMeetingsForUser(ownerId);
  const ids = list.map((m) => m.id);
  expect(ids).toContain(ownedMeetingId);
  expect(ids).toContain(legacyMeetingId);
  expect(ids).not.toContain(othersMeetingId);
});

test("authorizeUserForMeeting：按邮箱授权后可访问会议，且非管理员会被升级为 ADMIN", async () => {
  expect(await canAccessMeeting(staffId, othersMeetingId)).toBe(false);

  const result = await authorizeUserForMeeting(othersMeetingId, "iso-staff@example.com");
  expect(result.userId).toBe(staffId);

  expect(await canAccessMeeting(staffId, othersMeetingId)).toBe(true);
  const listed = await listMeetingsForUser(staffId);
  expect(listed.map((m) => m.id)).toContain(othersMeetingId);

  const promoted = await prisma.user.findUnique({ where: { id: staffId } });
  expect(promoted?.role).toBe("ADMIN");

  const staffRows = await listMeetingStaff(othersMeetingId);
  expect(staffRows.some((s) => s.userId === staffId)).toBe(true);
});

test("authorizeUserForMeeting：邮箱不存在/重复授权/授权归属者均报错", async () => {
  await expect(authorizeUserForMeeting(othersMeetingId, "not-registered@example.com")).rejects.toThrow(
    "USER_NOT_FOUND",
  );
  await expect(authorizeUserForMeeting(othersMeetingId, "iso-staff@example.com")).rejects.toThrow(
    "ALREADY_AUTHORIZED",
  );
  await expect(authorizeUserForMeeting(othersMeetingId, "iso-stranger@example.com")).rejects.toThrow(
    "ALREADY_OWNER",
  );
});

test("revokeMeetingStaff：撤销后不再可访问", async () => {
  await revokeMeetingStaff(othersMeetingId, staffId);
  expect(await canAccessMeeting(staffId, othersMeetingId)).toBe(false);
});
