import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

const meetingMock = vi.hoisted(() => ({ getCurrentMeetingId: vi.fn() }));
vi.mock("@/lib/meetings", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/meetings")>()),
  getCurrentMeetingId: meetingMock.getCurrentMeetingId,
}));

import { auth } from "@/lib/auth";
import { POST as createSpeakerApi } from "@/app/api/admin/speakers/route";
import {
  acceptSpeakerInvitation,
  SPEAKER_GUEST_NOTE,
  LEGACY_SPEAKER_GUEST_NOTES,
} from "@/lib/speakers-admin";
import { findSpeakersMissingGuest, repairSpeakerGuests } from "@/lib/speaker-guest-repair";

const mockedAuth = vi.mocked(auth);

let adminId: string;
let speakerUserId: string;
let meetingId: string;

beforeAll(async () => {
  for (const email of ["sg-admin@example.com", "sg-speaker@example.com"]) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      await prisma.registration.deleteMany({ where: { userId: u.id } });
      await prisma.speaker.deleteMany({ where: { userId: u.id } });
      await prisma.meeting.deleteMany({ where: { ownerId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
  }
  const admin = await prisma.user.create({
    data: { name: "讲者嘉宾管理员", email: "sg-admin@example.com", passwordHash: "x", role: "ADMIN" },
  });
  adminId = admin.id;
  const sp = await prisma.user.create({
    data: { name: "受邀讲者", email: "sg-speaker@example.com", passwordHash: "x" },
  });
  speakerUserId = sp.id;
  const m = await prisma.meeting.create({ data: { title: "讲者嘉宾联动会议", ownerId: adminId } });
  meetingId = m.id;
});

beforeEach(async () => {
  mockedAuth.mockResolvedValue({ user: { id: adminId, role: "ADMIN" } } as never);
  meetingMock.getCurrentMeetingId.mockResolvedValue(meetingId);
  await prisma.guest.deleteMany({ where: { meetingId } });
  await prisma.registration.deleteMany({ where: { meetingId } });
  await prisma.speaker.deleteMany({ where: { meetingId } });
});

afterAll(async () => {
  await prisma.guest.deleteMany({ where: { meetingId } });
  await prisma.registration.deleteMany({ where: { meetingId } });
  await prisma.speaker.deleteMany({ where: { meetingId } });
  await prisma.meeting.delete({ where: { id: meetingId } }).catch(() => {});
  await prisma.registrationType.deleteMany({ where: { name: "讲者" } }).catch(() => {});
  await prisma.user.deleteMany({ where: { id: { in: [adminId, speakerUserId] } } });
  await prisma.$disconnect();
});

function speakerForm(name: string) {
  const form = new FormData();
  form.append("name", name);
  form.append("title", "教授");
  form.append("organization", "测试大学");
  form.append("bio", "简介");
  form.append("photoUrl", "");
  return new Request("http://localhost/api/admin/speakers", { method: "POST", body: form });
}

test("创建讲者会同时生成嘉宾记录", async () => {
  const res = await createSpeakerApi(speakerForm("讲者甲"));
  expect(res.status).toBe(200);

  const guests = await prisma.guest.findMany({ where: { meetingId, name: "讲者甲" } });
  expect(guests).toHaveLength(1);
  expect(guests[0].note).toBe(SPEAKER_GUEST_NOTE);
  expect(guests[0].company).toBe("测试大学");
});

test("嘉宾创建失败时讲者不落库——两者必须同生共死", async () => {
  // 让事务内的 guest.create 真实抛错，验证 speaker.create 会随之回滚
  const realTransaction = prisma.$transaction.bind(prisma);
  const spy = vi
    .spyOn(prisma, "$transaction")
    .mockImplementation(((arg: unknown) => {
      if (typeof arg !== "function") {
        return (realTransaction as (a: unknown) => unknown)(arg);
      }
      return (realTransaction as (cb: (tx: unknown) => unknown) => unknown)(async (tx) => {
        const failing = new Proxy(tx as Record<string, unknown>, {
          get(target, prop) {
            if (prop === "guest") {
              return {
                create: () => {
                  throw new Error("模拟嘉宾写入失败");
                },
              };
            }
            return target[prop as string];
          },
        });
        return (arg as (t: unknown) => unknown)(failing);
      });
    }) as typeof prisma.$transaction);

  try {
    const res = await createSpeakerApi(speakerForm("回滚讲者"));
    expect(res.status).toBe(500);
  } finally {
    spy.mockRestore();
  }

  // 讲者必须一起回滚，否则嘉宾管理里就会查无此人
  expect(await prisma.speaker.findMany({ where: { meetingId, name: "回滚讲者" } })).toHaveLength(0);
  expect(await prisma.guest.findMany({ where: { meetingId, name: "回滚讲者" } })).toHaveLength(0);
});

test("接受邀约会认领既有的嘉宾记录，不产生第二条", async () => {
  await createSpeakerApi(speakerForm("讲者乙"));
  const speaker = await prisma.speaker.findFirstOrThrow({ where: { meetingId, name: "讲者乙" } });
  await prisma.speaker.update({ where: { id: speaker.id }, data: { token: "tok-yi", invitedAt: new Date() } });

  await acceptSpeakerInvitation("tok-yi", speakerUserId);

  const guests = await prisma.guest.findMany({ where: { meetingId, name: "讲者乙" } });
  expect(guests).toHaveLength(1);
  expect(guests[0].confirmed).toBe(true);
});

test("历史遗留标签的嘉宾也能被认领，不会重复生成", async () => {
  const speaker = await prisma.speaker.create({
    data: { meetingId, name: "讲者丙", organization: "老单位", token: "tok-bing", invitedAt: new Date() },
  });
  expect(speaker.id).toBeTruthy();
  // 模拟旧版本兜底分支写下的另一种备注
  await prisma.guest.create({
    data: { meetingId, name: "讲者丙", company: "老单位", note: LEGACY_SPEAKER_GUEST_NOTES[0] },
  });

  await acceptSpeakerInvitation("tok-bing", speakerUserId);

  const guests = await prisma.guest.findMany({ where: { meetingId, name: "讲者丙" } });
  expect(guests).toHaveLength(1);
  expect(guests[0].confirmed).toBe(true);
});

test("修复脚本能找出缺嘉宾记录的讲者并补齐", async () => {
  // 直接建讲者，模拟历史上嘉宾写入失败留下的孤儿
  await prisma.speaker.create({
    data: { meetingId, name: "孤儿讲者", organization: "某单位", title: "研究员", confirmed: true },
  });
  await prisma.speaker.create({ data: { meetingId, name: "正常讲者", organization: "某单位" } });
  await prisma.guest.create({
    data: { meetingId, name: "正常讲者", company: "某单位", note: SPEAKER_GUEST_NOTE },
  });

  const missing = await findSpeakersMissingGuest(meetingId);
  expect(missing.map((s) => s.name)).toEqual(["孤儿讲者"]);

  const result = await repairSpeakerGuests(meetingId);
  expect(result.created).toBe(1);

  const guest = await prisma.guest.findFirst({ where: { meetingId, name: "孤儿讲者" } });
  expect(guest?.company).toBe("某单位");
  expect(guest?.note).toBe(SPEAKER_GUEST_NOTE);
  // 讲者已认证，补出来的嘉宾也应是已确认状态
  expect(guest?.confirmed).toBe(true);

  // 幂等：再跑一次不应重复创建
  expect((await repairSpeakerGuests(meetingId)).created).toBe(0);
});
