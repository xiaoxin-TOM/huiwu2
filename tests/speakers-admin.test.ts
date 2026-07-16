import { afterAll, beforeAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import { getSpeakerById } from "@/lib/speakers";
import {
  createSpeaker,
  updateSpeaker,
  deleteSpeaker,
  ensureSpeakerToken,
  getSpeakerByToken,
  acceptSpeakerInvitation,
  getSpeakerByUserId,
} from "@/lib/speakers-admin";

const ids: string[] = [];
let meetingId: string;
let userId: string;

beforeAll(async () => {
  const m = await prisma.meeting.create({ data: { title: "讲者测试会议" } });
  meetingId = m.id;
  const u = await prisma.user.create({
    data: { name: "讲者用户", email: "speakeruser@example.com", passwordHash: "x", isActive: true },
  });
  userId = u.id;
});

afterAll(async () => {
  await prisma.speakerMaterial.deleteMany({ where: { speakerId: { in: ids } } });
  await prisma.speaker.deleteMany({ where: { id: { in: ids } } });
  await prisma.registration.deleteMany({ where: { userId, meetingId } });
  await prisma.guest.deleteMany({ where: { meetingId } });
  await prisma.meeting.delete({ where: { id: meetingId } }).catch(() => {});
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await prisma.$disconnect();
});

test("建→改→删 讲者", async () => {
  const s = await createSpeaker(meetingId, {
    name: "测试讲者", title: "教授", organization: "测试大学", bio: "<p>简介</p>",
    photoUrl: "",
  });
  ids.push(s.id);
  expect(s.name).toBe("测试讲者");

  const up = await updateSpeaker(s.id, {
    name: "测试讲者", title: "主任", organization: "测试大学", bio: "<p>新简介</p>",
    photoUrl: "",
  });
  expect(up.title).toBe("主任");

  await deleteSpeaker(s.id);
  expect(await getSpeakerById(s.id, meetingId)).toBeNull();
});

test("生成邀约链接并接受绑定用户，同时生成报名和确认嘉宾", async () => {
  const s = await createSpeaker(meetingId, {
    name: "受邀讲者", title: "博士", organization: "受邀大学", bio: "",
    photoUrl: "",
  });
  ids.push(s.id);

  const withToken = await ensureSpeakerToken(s.id);
  expect(withToken.token).toBeTruthy();
  expect(withToken.invitedAt).toBeTruthy();

  const found = await getSpeakerByToken(withToken.token!);
  expect(found).not.toBeNull();
  expect(found?.name).toBe("受邀讲者");

  await acceptSpeakerInvitation(withToken.token!, userId);
  const bound = await getSpeakerByUserId(userId, meetingId);
  expect(bound).not.toBeNull();
  expect(bound?.id).toBe(s.id);
  expect(bound?.confirmed).toBe(true);
  expect(bound?.userId).toBe(userId);

  const registration = await prisma.registration.findUnique({
    where: { userId_meetingId: { userId, meetingId } },
    include: { type: true },
  });
  expect(registration).not.toBeNull();
  expect(registration?.status).toBe("APPROVED");
  expect(registration?.type.name).toBe("讲者");

  const guest = await prisma.guest.findFirst({
    where: { meetingId, name: "受邀讲者" },
  });
  expect(guest).not.toBeNull();
  expect(guest?.confirmed).toBe(true);
});
