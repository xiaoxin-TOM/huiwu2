import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/email", () => ({
  sendNotificationEmail: vi.fn(async () => {}),
  sendVerificationCode: vi.fn(async () => {}),
}));

import { auth } from "@/lib/auth";
import { POST as submitApi } from "@/app/api/feedback/route";
import { POST as replyApi } from "@/app/api/admin/feedback/[id]/route";
import { POST as contactApi } from "@/app/api/admin/contact/route";
import { getMeetingContact } from "@/lib/feedback";

const mockedAuth = vi.mocked(auth);

let ownerId: string;
let staffId: string;
let userId: string;
let otherAdminId: string;
let meetingId: string;
let otherMeetingId: string;

function submitReq(fields: Record<string, string>) {
  const form = new FormData();
  form.append("meetingId", meetingId);
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  return new Request("http://localhost/api/feedback", { method: "POST", body: form });
}

beforeAll(async () => {
  for (const email of ["fb-owner@example.com", "fb-staff@example.com", "fb-user@example.com", "fb-other@example.com"]) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      await prisma.feedback.deleteMany({ where: { userId: u.id } });
      await prisma.notification.deleteMany({ where: { userId: u.id } });
      await prisma.meeting.deleteMany({ where: { ownerId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
  }
  const owner = await prisma.user.create({
    data: { name: "主办", email: "fb-owner@example.com", passwordHash: "x", role: "ADMIN" },
  });
  ownerId = owner.id;
  const staff = await prisma.user.create({
    data: { name: "协办", email: "fb-staff@example.com", passwordHash: "x", role: "ADMIN" },
  });
  staffId = staff.id;
  const user = await prisma.user.create({
    data: { name: "参会者", email: "fb-user@example.com", passwordHash: "x" },
  });
  userId = user.id;
  const other = await prisma.user.create({
    data: { name: "他人管理员", email: "fb-other@example.com", passwordHash: "x", role: "ADMIN" },
  });
  otherAdminId = other.id;

  const m = await prisma.meeting.create({ data: { title: "反馈测试会议", ownerId } });
  meetingId = m.id;
  await prisma.meetingStaff.create({ data: { meetingId, userId: staffId } });
  const om = await prisma.meeting.create({ data: { title: "他人会议", ownerId: otherAdminId } });
  otherMeetingId = om.id;
});

beforeEach(async () => {
  mockedAuth.mockResolvedValue(null as never);
  await prisma.feedback.deleteMany({ where: { meetingId: { in: [meetingId, otherMeetingId] } } });
  await prisma.notification.deleteMany({ where: { meetingId: { in: [meetingId, otherMeetingId] } } });
  await prisma.notificationDelivery.deleteMany({});
});

afterAll(async () => {
  await prisma.feedback.deleteMany({ where: { meetingId: { in: [meetingId, otherMeetingId] } } });
  await prisma.notification.deleteMany({ where: { meetingId: { in: [meetingId, otherMeetingId] } } });
  await prisma.notificationDelivery.deleteMany({});
  await prisma.meetingContact.deleteMany({ where: { meetingId } });
  await prisma.meetingStaff.deleteMany({ where: { meetingId } });
  await prisma.meeting.deleteMany({ where: { id: { in: [meetingId, otherMeetingId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [ownerId, staffId, userId, otherAdminId] } } });
  await prisma.$disconnect();
});

test("登录用户提交反馈，管理员收到站内信，邮件只给 owner", async () => {
  mockedAuth.mockResolvedValue({ user: { id: userId, role: "USER" } } as never);
  const res = await submitApi(submitReq({ category: "BUG", content: "日程页打不开" }));
  expect(res.status).toBe(200);

  const fb = await prisma.feedback.findFirstOrThrow({ where: { meetingId } });
  expect(fb.userId).toBe(userId);
  expect(fb.status).toBe("PENDING");

  const notes = await prisma.notification.findMany({ where: { meetingId } });
  expect(notes.map((n) => n.userId).sort()).toEqual([ownerId, staffId].sort());
  expect(notes[0].linkHref).toBe("/admin/feedback");

  const queued = await prisma.notificationDelivery.findMany({});
  expect(queued).toHaveLength(1);
  expect(queued[0].toAddress).toBe("fb-owner@example.com");
});

test("游客必须留联系方式才能提交", async () => {
  const noContact = await submitApi(submitReq({ category: "CONSULT", content: "请问几点开始" }));
  expect(noContact.status).toBe(400);
  await expect(noContact.json()).resolves.toMatchObject({ ok: false });
  expect(await prisma.feedback.count({ where: { meetingId } })).toBe(0);

  const withContact = await submitApi(
    submitReq({ category: "CONSULT", content: "请问几点开始", contact: "13800138000" }),
  );
  expect(withContact.status).toBe(200);

  const fb = await prisma.feedback.findFirstOrThrow({ where: { meetingId } });
  expect(fb.userId).toBeNull();
  expect(fb.contact).toBe("13800138000");
});

test("空内容被拒绝", async () => {
  mockedAuth.mockResolvedValue({ user: { id: userId, role: "USER" } } as never);
  const res = await submitApi(submitReq({ category: "BUG", content: "   " }));
  expect(res.status).toBe(400);
});

test("回复后标记已解决并通知用户", async () => {
  mockedAuth.mockResolvedValue({ user: { id: userId, role: "USER" } } as never);
  await submitApi(submitReq({ category: "BUG", content: "日程页打不开" }));
  const fb = await prisma.feedback.findFirstOrThrow({ where: { meetingId } });
  await prisma.notification.deleteMany({ where: { meetingId } });
  await prisma.notificationDelivery.deleteMany({});

  mockedAuth.mockResolvedValue({ user: { id: ownerId, role: "ADMIN" } } as never);
  const form = new FormData();
  form.append("action", "reply");
  form.append("reply", "已修复，请刷新重试");
  const res = await replyApi(new Request("http://localhost", { method: "POST", body: form }), {
    params: Promise.resolve({ id: fb.id }),
  });
  expect(res.status).toBe(200);

  const after = await prisma.feedback.findUniqueOrThrow({ where: { id: fb.id } });
  expect(after.status).toBe("RESOLVED");
  expect(after.reply).toBe("已修复，请刷新重试");
  expect(after.repliedById).toBe(ownerId);

  const notes = await prisma.notification.findMany({ where: { userId } });
  expect(notes).toHaveLength(1);
  expect(notes[0].type).toBe("FEEDBACK_REPLIED");
  expect(notes[0].linkHref).toBe(`/m/${meetingId}/feedback`);
});

test("回复游客反馈不产生站内信，也不报错", async () => {
  await submitApi(submitReq({ category: "CONSULT", content: "咨询", contact: "13800138000" }));
  const fb = await prisma.feedback.findFirstOrThrow({ where: { meetingId } });
  await prisma.notification.deleteMany({ where: { meetingId } });

  mockedAuth.mockResolvedValue({ user: { id: ownerId, role: "ADMIN" } } as never);
  const form = new FormData();
  form.append("reply", "已电话回复");
  const res = await replyApi(new Request("http://localhost", { method: "POST", body: form }), {
    params: Promise.resolve({ id: fb.id }),
  });
  expect(res.status).toBe(200);
  expect(await prisma.notification.count({ where: { meetingId } })).toBe(0);
});

test("空回复被拒绝", async () => {
  mockedAuth.mockResolvedValue({ user: { id: userId, role: "USER" } } as never);
  await submitApi(submitReq({ category: "BUG", content: "内容" }));
  const fb = await prisma.feedback.findFirstOrThrow({ where: { meetingId } });

  mockedAuth.mockResolvedValue({ user: { id: ownerId, role: "ADMIN" } } as never);
  const form = new FormData();
  form.append("reply", "  ");
  const res = await replyApi(new Request("http://localhost", { method: "POST", body: form }), {
    params: Promise.resolve({ id: fb.id }),
  });
  expect(res.status).toBe(400);
});

test("其他会议的管理员不能回复本会议反馈", async () => {
  mockedAuth.mockResolvedValue({ user: { id: userId, role: "USER" } } as never);
  await submitApi(submitReq({ category: "BUG", content: "内容" }));
  const fb = await prisma.feedback.findFirstOrThrow({ where: { meetingId } });

  mockedAuth.mockResolvedValue({ user: { id: otherAdminId, role: "ADMIN" } } as never);
  const form = new FormData();
  form.append("reply", "越权回复");
  const res = await replyApi(new Request("http://localhost", { method: "POST", body: form }), {
    params: Promise.resolve({ id: fb.id }),
  });
  expect(res.status).toBe(403);

  expect((await prisma.feedback.findUniqueOrThrow({ where: { id: fb.id } })).status).toBe("PENDING");
});

test("非管理员不能回复", async () => {
  mockedAuth.mockResolvedValue({ user: { id: userId, role: "USER" } } as never);
  await submitApi(submitReq({ category: "BUG", content: "内容" }));
  const fb = await prisma.feedback.findFirstOrThrow({ where: { meetingId } });

  const form = new FormData();
  form.append("reply", "我是用户");
  const res = await replyApi(new Request("http://localhost", { method: "POST", body: form }), {
    params: Promise.resolve({ id: fb.id }),
  });
  expect(res.status).toBe(403);
});

test("保存联系方式并挡掉非法二维码地址", async () => {
  mockedAuth.mockResolvedValue({ user: { id: ownerId, role: "ADMIN" } } as never);

  const bad = new FormData();
  bad.append("phone", "010-12345678");
  bad.append("wecomQrUrl", "javascript:alert(1)");
  const badRes = await contactApi(
    new Request("http://localhost", { method: "POST", headers: { cookie: `admin_meeting_id=${meetingId}` }, body: bad }),
  );
  expect(badRes.status).toBe(400);

  const good = new FormData();
  good.append("orgName", "主办方");
  good.append("phone", "010-12345678");
  good.append("wechatId", "huiwu2026");
  good.append("wecomQrUrl", "https://oss.example.com/wecom.png");
  good.append("wecomNote", "工作日 9:00-18:00");
  const res = await contactApi(
    new Request("http://localhost", { method: "POST", headers: { cookie: `admin_meeting_id=${meetingId}` }, body: good }),
  );
  expect(res.status).toBe(200);

  const saved = await getMeetingContact(meetingId);
  expect(saved?.phone).toBe("010-12345678");
  expect(saved?.wecomQrUrl).toBe("https://oss.example.com/wecom.png");
  // 未填的二维码存 null，展示层直接按真假判断
  expect(saved?.groupQrUrl).toBeNull();
});

test("非管理员不能改联系方式", async () => {
  mockedAuth.mockResolvedValue({ user: { id: userId, role: "USER" } } as never);
  const form = new FormData();
  form.append("phone", "010-00000000");
  const res = await contactApi(
    new Request("http://localhost", { method: "POST", headers: { cookie: `admin_meeting_id=${meetingId}` }, body: form }),
  );
  expect(res.status).toBe(403);
});
