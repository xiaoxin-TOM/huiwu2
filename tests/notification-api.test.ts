import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

const mailMock = vi.hoisted(() => ({ sendNotificationEmail: vi.fn(async () => {}) }));
vi.mock("@/lib/email", () => ({
  sendNotificationEmail: mailMock.sendNotificationEmail,
  sendVerificationCode: vi.fn(async () => {}),
}));

import { auth } from "@/lib/auth";
import { POST as reviewSubmissionApi } from "@/app/api/admin/submissions/[id]/route";
import { POST as flushApi } from "@/app/api/cron/flush-notifications/route";
import { notifyRegistrationSubmitted, notifySubmissionReviewed } from "@/lib/notification-hooks";
import { flushNotificationDeliveries } from "@/lib/notification-delivery";
import { MAX_DELIVERY_ATTEMPTS } from "@/lib/notification-templates";

const mockedAuth = vi.mocked(auth);

let ownerId: string;
let staffId: string;
let attendeeId: string;
let meetingId: string;
let typeId: string;

beforeAll(async () => {
  for (const email of ["nt-owner@example.com", "nt-staff@example.com", "nt-user@example.com"]) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      await prisma.notification.deleteMany({ where: { userId: u.id } });
      await prisma.submission.deleteMany({ where: { userId: u.id } });
      await prisma.registration.deleteMany({ where: { userId: u.id } });
      await prisma.meeting.deleteMany({ where: { ownerId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
  }
  const owner = await prisma.user.create({
    data: { name: "会议主办", email: "nt-owner@example.com", passwordHash: "x", role: "ADMIN" },
  });
  ownerId = owner.id;
  const staff = await prisma.user.create({
    data: { name: "协办", email: "nt-staff@example.com", passwordHash: "x", role: "ADMIN" },
  });
  staffId = staff.id;
  const attendee = await prisma.user.create({
    data: { name: "参会者", email: "nt-user@example.com", passwordHash: "x" },
  });
  attendeeId = attendee.id;

  const m = await prisma.meeting.create({
    data: { title: "通知测试会议", ownerId, requireApproval: true },
  });
  meetingId = m.id;
  await prisma.meetingStaff.create({ data: { meetingId, userId: staffId } });

  const t = await prisma.registrationType.create({ data: { name: `通知类型-${Date.now()}`, fee: 0 } });
  typeId = t.id;
});

beforeEach(async () => {
  mailMock.sendNotificationEmail.mockReset();
  mailMock.sendNotificationEmail.mockResolvedValue(undefined);
  mockedAuth.mockResolvedValue({ user: { id: ownerId, role: "ADMIN" } } as never);
  await prisma.notification.deleteMany({ where: { meetingId } });
  await prisma.notificationDelivery.deleteMany({});
  process.env.CRON_SECRET = "test-cron-secret";
});

afterAll(async () => {
  await prisma.notification.deleteMany({ where: { meetingId } });
  await prisma.notificationDelivery.deleteMany({});
  await prisma.submission.deleteMany({ where: { meetingId } });
  await prisma.registration.deleteMany({ where: { meetingId } });
  await prisma.meetingStaff.deleteMany({ where: { meetingId } });
  await prisma.meeting.delete({ where: { id: meetingId } }).catch(() => {});
  await prisma.registrationType.delete({ where: { id: typeId } }).catch(() => {});
  await prisma.user.deleteMany({ where: { id: { in: [ownerId, staffId, attendeeId] } } });
  await prisma.$disconnect();
});

test("提交报名：站内信给 owner 和协办，邮件只给 owner", async () => {
  const reg = await prisma.registration.create({
    data: { userId: attendeeId, meetingId, typeId, fullName: "参会者", status: "PENDING" },
  });
  await notifyRegistrationSubmitted(reg.id);

  const notes = await prisma.notification.findMany({ where: { meetingId } });
  expect(notes.map((n) => n.userId).sort()).toEqual([ownerId, staffId].sort());
  expect(notes[0].type).toBe("REGISTRATION_SUBMITTED");
  expect(notes[0].linkHref).toBe("/admin/registrations");

  const queued = await prisma.notificationDelivery.findMany({});
  expect(queued).toHaveLength(1);
  expect(queued[0].toAddress).toBe("nt-owner@example.com");

  await prisma.registration.delete({ where: { id: reg.id } });
});

test("免审会议直接通过时不打扰管理员", async () => {
  const reg = await prisma.registration.create({
    data: { userId: attendeeId, meetingId, typeId, fullName: "参会者", status: "APPROVED" },
  });
  await notifyRegistrationSubmitted(reg.id);

  expect(await prisma.notification.count({ where: { meetingId } })).toBe(0);
  expect(await prisma.notificationDelivery.count()).toBe(0);

  await prisma.registration.delete({ where: { id: reg.id } });
});

test("审核投稿后申请人收到站内信与邮件，且区分通过与驳回", async () => {
  const sub = await prisma.submission.create({
    data: { userId: attendeeId, meetingId, title: "深度学习进展", authors: "张三", abstract: "摘要" },
  });

  const form = new FormData();
  form.append("decision", "REJECTED");
  const res = await reviewSubmissionApi(new Request("http://localhost", { method: "POST", body: form }), {
    params: Promise.resolve({ id: sub.id }),
  });
  expect(res.status).toBe(200);

  const notes = await prisma.notification.findMany({ where: { userId: attendeeId } });
  expect(notes).toHaveLength(1);
  expect(notes[0].title).toContain("未通过");
  expect(notes[0].body).toContain("深度学习进展");
  expect(notes[0].readAt).toBeNull();

  const queued = await prisma.notificationDelivery.findMany({});
  expect(queued).toHaveLength(1);
  expect(queued[0].toAddress).toBe("nt-user@example.com");
  expect(queued[0].status).toBe("PENDING");

  await prisma.submission.delete({ where: { id: sub.id } });
});

test("通知写入失败不影响审核结果", async () => {
  const sub = await prisma.submission.create({
    data: { userId: attendeeId, meetingId, title: "容错测试", authors: "张三", abstract: "摘要" },
  });
  const spy = vi
    .spyOn(prisma.notification, "createMany")
    .mockRejectedValue(new Error("模拟通知写入失败"));

  try {
    const form = new FormData();
    form.append("decision", "APPROVED");
    const res = await reviewSubmissionApi(new Request("http://localhost", { method: "POST", body: form }), {
      params: Promise.resolve({ id: sub.id }),
    });
    // 审核本身必须成功
    expect(res.status).toBe(200);
  } finally {
    spy.mockRestore();
  }

  expect((await prisma.submission.findUnique({ where: { id: sub.id } }))?.status).toBe("APPROVED");
  await prisma.submission.delete({ where: { id: sub.id } });
});

test("刷队列成功后标记已发送", async () => {
  await notifySubmissionReviewed(
    (
      await prisma.submission.create({
        data: { userId: attendeeId, meetingId, title: "队列测试", authors: "李四", abstract: "摘要" },
      })
    ).id,
    "APPROVED",
  );

  const result = await flushNotificationDeliveries();
  expect(result.sent).toBe(1);
  expect(mailMock.sendNotificationEmail).toHaveBeenCalledTimes(1);

  const row = await prisma.notificationDelivery.findFirstOrThrow({});
  expect(row.status).toBe("SENT");
  expect(row.sentAt).not.toBeNull();

  await prisma.submission.deleteMany({ where: { meetingId } });
});

test("发送失败进入退避重试，未到期不重复发送", async () => {
  await prisma.notificationDelivery.create({
    data: { toAddress: "x@example.com", subject: "主题", bodyText: "正文" },
  });
  mailMock.sendNotificationEmail.mockRejectedValue(new Error("SMTP 限流"));

  const first = await flushNotificationDeliveries();
  expect(first.retry).toBe(1);

  const row = await prisma.notificationDelivery.findFirstOrThrow({});
  expect(row.status).toBe("PENDING");
  expect(row.attempts).toBe(1);
  expect(row.lastError).toContain("SMTP 限流");
  expect(row.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());

  // 下次到期前再刷不应重复尝试
  mailMock.sendNotificationEmail.mockReset();
  const second = await flushNotificationDeliveries();
  expect(second.picked).toBe(0);
  expect(mailMock.sendNotificationEmail).not.toHaveBeenCalled();
});

test("超过最大次数后标记 FAILED 不再重试", async () => {
  await prisma.notificationDelivery.create({
    data: {
      toAddress: "x@example.com",
      subject: "主题",
      bodyText: "正文",
      attempts: MAX_DELIVERY_ATTEMPTS - 1,
    },
  });
  mailMock.sendNotificationEmail.mockRejectedValue(new Error("一直失败"));

  const result = await flushNotificationDeliveries();
  expect(result.failed).toBe(1);

  const row = await prisma.notificationDelivery.findFirstOrThrow({});
  expect(row.status).toBe("FAILED");
  expect(row.attempts).toBe(MAX_DELIVERY_ATTEMPTS);
});

test("cron 接口校验密钥", async () => {
  const noSecret = await flushApi(new Request("http://localhost", { method: "POST" }));
  expect(noSecret.status).toBe(403);

  const wrong = await flushApi(
    new Request("http://localhost", { method: "POST", headers: { "x-cron-secret": "wrong-secret" } }),
  );
  expect(wrong.status).toBe(403);

  const ok = await flushApi(
    new Request("http://localhost", { method: "POST", headers: { "x-cron-secret": "test-cron-secret" } }),
  );
  expect(ok.status).toBe(200);
  await expect(ok.json()).resolves.toMatchObject({ ok: true });
});

test("未配置 CRON_SECRET 时拒绝执行，不给空口令放行", async () => {
  delete process.env.CRON_SECRET;
  const res = await flushApi(
    new Request("http://localhost", { method: "POST", headers: { "x-cron-secret": "" } }),
  );
  expect(res.status).toBe(503);
  process.env.CRON_SECRET = "test-cron-secret";
});
