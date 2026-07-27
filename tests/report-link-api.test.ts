import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

const ossMock = vi.hoisted(() => ({ getSpeakerMaterialStream: vi.fn() }));
vi.mock("@/lib/oss", () => ({
  getSpeakerMaterialStream: ossMock.getSpeakerMaterialStream,
  deleteSpeakerMaterialFromOSS: vi.fn(async () => {}),
  validateSpeakerMaterial: () => null,
  uploadToOSS: vi.fn(),
}));

// cookie 罐由测试逐例注入，模拟浏览器带上闸口 cookie
const cookieJar = vi.hoisted(() => ({ value: new Map<string, string>() }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      const v = cookieJar.value.get(name);
      return v === undefined ? undefined : { name, value: v };
    },
  })),
}));

import { Readable } from "node:stream";
import { auth } from "@/lib/auth";
import { POST as createLinkApi } from "@/app/api/admin/report-links/route";
import { POST as toggleLinkApi } from "@/app/api/admin/report-links/[id]/route";
import { POST as authApi } from "@/app/api/report-links/[token]/auth/route";
import { GET as fileApi } from "@/app/api/materials/[id]/file/route";

const mockedAuth = vi.mocked(auth);

let adminId: string;
let otherAdminId: string;
let meetingId: string;
let otherMeetingId: string;
let speakerId: string;
let sessionId: string;
let confidentialId: string;
let pendingId: string;

function adminReq(body: FormData, meeting = meetingId) {
  return new Request("http://localhost/api/admin/report-links", {
    method: "POST",
    headers: { cookie: `admin_meeting_id=${meeting}` },
    body,
  });
}

beforeAll(async () => {
  for (const email of ["rl-admin@example.com", "rl-other@example.com"]) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      await prisma.meeting.deleteMany({ where: { ownerId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
  }
  const admin = await prisma.user.create({
    data: { name: "汇报管理员", email: "rl-admin@example.com", passwordHash: "x", role: "ADMIN" },
  });
  adminId = admin.id;
  const other = await prisma.user.create({
    data: { name: "他人管理员", email: "rl-other@example.com", passwordHash: "x", role: "ADMIN" },
  });
  otherAdminId = other.id;

  const m = await prisma.meeting.create({ data: { title: "汇报测试会议", ownerId: adminId } });
  meetingId = m.id;
  const om = await prisma.meeting.create({ data: { title: "他人会议", ownerId: otherAdminId } });
  otherMeetingId = om.id;

  const speaker = await prisma.speaker.create({ data: { meetingId, name: "汇报讲者" } });
  speakerId = speaker.id;
  const session = await prisma.session.create({
    data: { meetingId, day: "2026-08-02", startTime: "14:00", endTime: "15:00", room: "主会场", title: "专题报告" },
  });
  sessionId = session.id;

  const base = {
    speakerId,
    sessionId,
    fileKey: "uploads/speakers/rl/secret.pptx",
    fileUrl: "https://oss.example.com/uploads/speakers/rl/secret.pptx",
    fileName: "保密稿.pptx",
    fileSize: 4096,
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  };
  const secret = await prisma.speakerMaterial.create({
    data: { ...base, isConfidential: true, status: "APPROVED" },
  });
  confidentialId = secret.id;
  const pending = await prisma.speakerMaterial.create({
    data: { ...base, fileName: "待审稿.pptx", isConfidential: true, status: "PENDING" },
  });
  pendingId = pending.id;
});

beforeEach(() => {
  cookieJar.value = new Map();
  ossMock.getSpeakerMaterialStream.mockReset();
  ossMock.getSpeakerMaterialStream.mockImplementation(async () => Readable.from([Buffer.from("PPTXDATA")]));
  mockedAuth.mockResolvedValue({ user: { id: adminId, role: "ADMIN" } } as never);
});

afterAll(async () => {
  await prisma.speakerMaterial.deleteMany({ where: { speakerId } });
  await prisma.session.deleteMany({ where: { meetingId } });
  await prisma.speaker.deleteMany({ where: { meetingId } });
  await prisma.reportLink.deleteMany({ where: { meetingId: { in: [meetingId, otherMeetingId] } } });
  await prisma.meeting.deleteMany({ where: { id: { in: [meetingId, otherMeetingId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [adminId, otherAdminId] } } });
  await prisma.$disconnect();
});

async function createLink(password = "report123", expiresAt = "") {
  const form = new FormData();
  form.append("name", "主会场大屏");
  form.append("password", password);
  form.append("expiresAt", expiresAt);
  const res = await createLinkApi(adminReq(form));
  return { res, data: await res.json() };
}

/** 走一遍密码闸口，把返回的 cookie 塞进 cookie 罐 */
async function passGate(token: string, password: string) {
  const form = new FormData();
  form.append("password", password);
  const res = await authApi(new Request("http://localhost", { method: "POST", body: form }), {
    params: Promise.resolve({ token }),
  });
  for (const cookie of res.headers.getSetCookie()) {
    const [pair] = cookie.split(";");
    const idx = pair.indexOf("=");
    cookieJar.value.set(pair.slice(0, idx), pair.slice(idx + 1));
  }
  return res;
}

test("生成汇报链接需要密码，且密码至少 6 位", async () => {
  const short = new FormData();
  short.append("password", "12345");
  const res = await createLinkApi(adminReq(short));
  expect(res.status).toBe(400);

  const none = new FormData();
  const res2 = await createLinkApi(adminReq(none));
  expect(res2.status).toBe(400);
});

test("生成成功后返回可访问路径", async () => {
  const { res, data } = await createLink();
  expect(res.status).toBe(200);
  expect(data.ok).toBe(true);
  expect(data.path).toBe(`/p/${data.token}`);

  const link = await prisma.reportLink.findUnique({ where: { token: data.token } });
  expect(link?.meetingId).toBe(meetingId);
  // 密码必须是哈希存储
  expect(link?.passwordHash).not.toBe("report123");
  expect(link?.passwordHash.startsWith("$2")).toBe(true);
});

test("密码正确才放行，错误密码不下发 cookie", async () => {
  const { data } = await createLink("report123");

  const bad = await passGate(data.token, "wrongpass");
  expect(bad.status).toBe(401);
  expect(cookieJar.value.size).toBe(0);

  const good = await passGate(data.token, "report123");
  expect(good.status).toBe(200);
  expect(cookieJar.value.size).toBe(1);
});

test("通过闸口后可读取保密材料（未登录）", async () => {
  const { data } = await createLink("report123");
  await passGate(data.token, "report123");
  mockedAuth.mockResolvedValue(null as never);

  const req = new Request(`http://localhost/api/materials/${confidentialId}/file?rl=${data.token}`);
  const res = await fileApi(req, { params: Promise.resolve({ id: confidentialId }) });
  expect(res.status).toBe(200);
  expect(await res.text()).toBe("PPTXDATA");
});

test("通过闸口也读不到未过审的材料", async () => {
  const { data } = await createLink("report123");
  await passGate(data.token, "report123");
  mockedAuth.mockResolvedValue(null as never);

  const req = new Request(`http://localhost/api/materials/${pendingId}/file?rl=${data.token}`);
  const res = await fileApi(req, { params: Promise.resolve({ id: pendingId }) });
  expect(res.status).toBe(403);
});

test("停用链接后原 cookie 立刻失效", async () => {
  const { data } = await createLink("report123");
  await passGate(data.token, "report123");
  const link = await prisma.reportLink.findUnique({ where: { token: data.token } });

  const form = new FormData();
  form.append("action", "deactivate");
  const toggled = await toggleLinkApi(new Request("http://localhost", { method: "POST", body: form }), {
    params: Promise.resolve({ id: link!.id }),
  });
  expect(toggled.status).toBe(200);

  mockedAuth.mockResolvedValue(null as never);
  const req = new Request(`http://localhost/api/materials/${confidentialId}/file?rl=${data.token}`);
  const res = await fileApi(req, { params: Promise.resolve({ id: confidentialId }) });
  expect(res.status).toBe(403);
});

test("已过期的链接不放行，也拿不到 cookie", async () => {
  const past = new Date(Date.now() - 60_000).toISOString();
  const { data } = await createLink("report123", past);

  const res = await passGate(data.token, "report123");
  expect(res.status).toBe(403);
  expect(cookieJar.value.size).toBe(0);
});

test("改密码后旧 cookie 失效", async () => {
  const { data } = await createLink("report123");
  await passGate(data.token, "report123");

  // 直接改哈希模拟管理员重置密码
  await prisma.reportLink.update({
    where: { token: data.token },
    data: { passwordHash: "$2b$10$brandnewhashbrandnewhash" },
  });

  mockedAuth.mockResolvedValue(null as never);
  const req = new Request(`http://localhost/api/materials/${confidentialId}/file?rl=${data.token}`);
  const res = await fileApi(req, { params: Promise.resolve({ id: confidentialId }) });
  expect(res.status).toBe(403);
});

test("别的会议的管理员不能停用本会议的链接", async () => {
  const { data } = await createLink("report123");
  const link = await prisma.reportLink.findUnique({ where: { token: data.token } });

  mockedAuth.mockResolvedValue({ user: { id: otherAdminId, role: "ADMIN" } } as never);
  const form = new FormData();
  form.append("action", "deactivate");
  const res = await toggleLinkApi(new Request("http://localhost", { method: "POST", body: form }), {
    params: Promise.resolve({ id: link!.id }),
  });
  expect(res.status).toBe(403);

  const after = await prisma.reportLink.findUnique({ where: { id: link!.id } });
  expect(after?.isActive).toBe(true);
});

test("非管理员不能生成链接", async () => {
  mockedAuth.mockResolvedValue({ user: { id: "nobody", role: "USER" } } as never);
  const form = new FormData();
  form.append("password", "report123");
  const res = await createLinkApi(adminReq(form));
  expect(res.status).toBe(403);
});

test("不存在的 token 与错误密码返回同样的提示，避免枚举", async () => {
  const { data } = await createLink("report123");
  const wrong = await passGate(data.token, "nope123");
  const missing = await passGate("00000000-0000-0000-0000-000000000000", "whatever");

  expect(wrong.status).toBe(401);
  expect(missing.status).toBe(401);
  expect((await wrong.json()).error).toBe((await missing.json()).error);
});
