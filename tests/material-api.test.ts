import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

const ossMock = vi.hoisted(() => ({
  getSpeakerMaterialStream: vi.fn(),
  deleteSpeakerMaterialFromOSS: vi.fn(async () => {}),
}));

vi.mock("@/lib/oss", () => ({
  getSpeakerMaterialStream: ossMock.getSpeakerMaterialStream,
  deleteSpeakerMaterialFromOSS: ossMock.deleteSpeakerMaterialFromOSS,
  validateSpeakerMaterial: () => null,
  uploadToOSS: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: () => undefined })),
}));

import { Readable } from "node:stream";
import { auth } from "@/lib/auth";
import { GET as fileApi } from "@/app/api/materials/[id]/file/route";
import { DELETE as deleteApi } from "@/app/api/speaker-materials/[id]/route";
import { POST as reviewApi } from "@/app/api/admin/speaker-materials/[id]/route";

const mockedAuth = vi.mocked(auth);

let adminId: string;
let speakerUserId: string;
let attendeeId: string;
let outsiderId: string;
let meetingId: string;
let typeId: string;
let speakerId: string;
let sessionId: string;

async function makeMaterial(over: { isConfidential?: boolean; status?: string } = {}) {
  return prisma.speakerMaterial.create({
    data: {
      speakerId,
      sessionId,
      fileKey: "uploads/speakers/x/file.pdf",
      fileUrl: "https://oss.example.com/uploads/speakers/x/file.pdf",
      fileName: "报告.pdf",
      fileSize: 2048,
      mimeType: "application/pdf",
      isConfidential: over.isConfidential ?? false,
      status: over.status ?? "APPROVED",
    },
  });
}

function fileRequest(id: string) {
  return new Request(`http://localhost/api/materials/${id}/file`);
}

beforeAll(async () => {
  const emails = [
    "mat-admin@example.com",
    "mat-speaker@example.com",
    "mat-attendee@example.com",
    "mat-outsider@example.com",
  ];
  for (const email of emails) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      await prisma.speakerMaterial.deleteMany({ where: { speaker: { userId: u.id } } });
      await prisma.registration.deleteMany({ where: { userId: u.id } });
      await prisma.speaker.deleteMany({ where: { userId: u.id } });
      await prisma.meeting.deleteMany({ where: { ownerId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
  }

  const admin = await prisma.user.create({
    data: { name: "材料管理员", email: "mat-admin@example.com", passwordHash: "x", role: "ADMIN" },
  });
  adminId = admin.id;
  const sp = await prisma.user.create({
    data: { name: "材料讲者", email: "mat-speaker@example.com", passwordHash: "x" },
  });
  speakerUserId = sp.id;
  const at = await prisma.user.create({
    data: { name: "参会者", email: "mat-attendee@example.com", passwordHash: "x" },
  });
  attendeeId = at.id;
  const out = await prisma.user.create({
    data: { name: "路人", email: "mat-outsider@example.com", passwordHash: "x" },
  });
  outsiderId = out.id;

  const m = await prisma.meeting.create({
    data: { title: "材料测试会议", ownerId: adminId, requireRealName: true },
  });
  meetingId = m.id;

  const t = await prisma.registrationType.create({ data: { name: `材料类型-${Date.now()}`, fee: 0 } });
  typeId = t.id;
  await prisma.registration.create({
    data: { userId: attendeeId, meetingId, typeId, fullName: "参会者", status: "APPROVED" },
  });

  const speaker = await prisma.speaker.create({
    data: { meetingId, name: "材料讲者", userId: speakerUserId, confirmed: true },
  });
  speakerId = speaker.id;
  const session = await prisma.session.create({
    data: { meetingId, day: "2026-08-01", startTime: "09:00", endTime: "10:00", room: "主会场", title: "开幕报告" },
  });
  sessionId = session.id;
});

beforeEach(() => {
  ossMock.getSpeakerMaterialStream.mockReset();
  ossMock.getSpeakerMaterialStream.mockImplementation(async () => Readable.from([Buffer.from("PDFDATA")]));
});

afterAll(async () => {
  await prisma.speakerMaterial.deleteMany({ where: { speakerId } });
  await prisma.sessionSpeaker.deleteMany({ where: { sessionId } });
  await prisma.session.deleteMany({ where: { meetingId } });
  await prisma.speaker.deleteMany({ where: { meetingId } });
  await prisma.registration.deleteMany({ where: { meetingId } });
  await prisma.meeting.delete({ where: { id: meetingId } }).catch(() => {});
  await prisma.registrationType.delete({ where: { id: typeId } }).catch(() => {});
  await prisma.user.deleteMany({
    where: { id: { in: [adminId, speakerUserId, attendeeId, outsiderId] } },
  });
  await prisma.$disconnect();
});

test("参会用户可读取审核通过的公开材料，且响应不含 OSS 地址", async () => {
  const m = await makeMaterial();
  mockedAuth.mockResolvedValue({ user: { id: attendeeId, role: "USER" } } as never);

  const res = await fileApi(fileRequest(m.id), { params: Promise.resolve({ id: m.id }) });
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toBe("application/pdf");
  expect(res.headers.get("Cache-Control")).toBe("private, no-store");
  const body = await res.text();
  expect(body).toBe("PDFDATA");
  expect(JSON.stringify([...res.headers.entries()])).not.toContain("oss.example.com");
});

test("参会用户读不到保密材料", async () => {
  const m = await makeMaterial({ isConfidential: true });
  mockedAuth.mockResolvedValue({ user: { id: attendeeId, role: "USER" } } as never);

  const res = await fileApi(fileRequest(m.id), { params: Promise.resolve({ id: m.id }) });
  expect(res.status).toBe(403);
  expect(ossMock.getSpeakerMaterialStream).not.toHaveBeenCalled();
});

test("参会用户读不到未过审的材料", async () => {
  const m = await makeMaterial({ status: "PENDING" });
  mockedAuth.mockResolvedValue({ user: { id: attendeeId, role: "USER" } } as never);

  const res = await fileApi(fileRequest(m.id), { params: Promise.resolve({ id: m.id }) });
  expect(res.status).toBe(403);
});

test("讲者本人可读自己的保密且待审材料", async () => {
  const m = await makeMaterial({ isConfidential: true, status: "PENDING" });
  mockedAuth.mockResolvedValue({ user: { id: speakerUserId, role: "USER" } } as never);

  const res = await fileApi(fileRequest(m.id), { params: Promise.resolve({ id: m.id }) });
  expect(res.status).toBe(200);
});

test("管理员可读保密且待审材料", async () => {
  const m = await makeMaterial({ isConfidential: true, status: "PENDING" });
  mockedAuth.mockResolvedValue({ user: { id: adminId, role: "ADMIN" } } as never);

  const res = await fileApi(fileRequest(m.id), { params: Promise.resolve({ id: m.id }) });
  expect(res.status).toBe(200);
});

test("未报名的登录用户读不到公开材料", async () => {
  const m = await makeMaterial();
  mockedAuth.mockResolvedValue({ user: { id: outsiderId, role: "USER" } } as never);

  const res = await fileApi(fileRequest(m.id), { params: Promise.resolve({ id: m.id }) });
  expect(res.status).toBe(403);
});

test("未登录游客在要求实名的会议下读不到材料", async () => {
  const m = await makeMaterial();
  mockedAuth.mockResolvedValue(null as never);

  const res = await fileApi(fileRequest(m.id), { params: Promise.resolve({ id: m.id }) });
  expect(res.status).toBe(403);
});

test("会议关闭实名后游客可读公开材料，仍读不到保密材料", async () => {
  await prisma.meeting.update({ where: { id: meetingId }, data: { requireRealName: false } });
  mockedAuth.mockResolvedValue(null as never);

  const open = await makeMaterial();
  const secret = await makeMaterial({ isConfidential: true });

  const okRes = await fileApi(fileRequest(open.id), { params: Promise.resolve({ id: open.id }) });
  expect(okRes.status).toBe(200);
  const denyRes = await fileApi(fileRequest(secret.id), { params: Promise.resolve({ id: secret.id }) });
  expect(denyRes.status).toBe(403);

  await prisma.meeting.update({ where: { id: meetingId }, data: { requireRealName: true } });
});

test("不带有效 cookie 的汇报 token 不放行保密材料", async () => {
  const link = await prisma.reportLink.create({
    data: { meetingId, name: "大屏", passwordHash: "$2b$10$fakehashfakehashfakeha" },
  });
  const m = await makeMaterial({ isConfidential: true });
  mockedAuth.mockResolvedValue(null as never);

  const req = new Request(`http://localhost/api/materials/${m.id}/file?rl=${link.token}`);
  const res = await fileApi(req, { params: Promise.resolve({ id: m.id }) });
  expect(res.status).toBe(403);

  await prisma.reportLink.delete({ where: { id: link.id } });
});

test("缺少 fileKey 的历史记录返回 409 提示迁移", async () => {
  const m = await prisma.speakerMaterial.create({
    data: {
      speakerId,
      sessionId,
      fileKey: "",
      fileUrl: "https://oss.example.com/legacy.pdf",
      fileName: "老文件.pdf",
      fileSize: 100,
      mimeType: "application/pdf",
      status: "APPROVED",
    },
  });
  mockedAuth.mockResolvedValue({ user: { id: adminId, role: "ADMIN" } } as never);

  const res = await fileApi(fileRequest(m.id), { params: Promise.resolve({ id: m.id }) });
  expect(res.status).toBe(409);
});

test("讲者可删待审材料，同时清理 OSS 对象", async () => {
  const m = await makeMaterial({ status: "PENDING" });
  mockedAuth.mockResolvedValue({ user: { id: speakerUserId, role: "USER" } } as never);

  const res = await deleteApi(new Request("http://localhost", { method: "DELETE" }), {
    params: Promise.resolve({ id: m.id }),
  });
  expect(res.status).toBe(200);
  expect(ossMock.deleteSpeakerMaterialFromOSS).toHaveBeenCalledWith("uploads/speakers/x/file.pdf");
  expect(await prisma.speakerMaterial.findUnique({ where: { id: m.id } })).toBeNull();
});

test("讲者不能删已通过审核的材料", async () => {
  const m = await makeMaterial({ status: "APPROVED" });
  mockedAuth.mockResolvedValue({ user: { id: speakerUserId, role: "USER" } } as never);

  const res = await deleteApi(new Request("http://localhost", { method: "DELETE" }), {
    params: Promise.resolve({ id: m.id }),
  });
  expect(res.status).toBe(409);
  expect(await prisma.speakerMaterial.findUnique({ where: { id: m.id } })).not.toBeNull();
});

test("管理员可删已通过审核的材料", async () => {
  const m = await makeMaterial({ status: "APPROVED" });
  mockedAuth.mockResolvedValue({ user: { id: adminId, role: "ADMIN" } } as never);

  const res = await deleteApi(new Request("http://localhost", { method: "DELETE" }), {
    params: Promise.resolve({ id: m.id }),
  });
  expect(res.status).toBe(200);
});

test("他人不能删讲者的材料", async () => {
  const m = await makeMaterial({ status: "PENDING" });
  mockedAuth.mockResolvedValue({ user: { id: outsiderId, role: "USER" } } as never);

  const res = await deleteApi(new Request("http://localhost", { method: "DELETE" }), {
    params: Promise.resolve({ id: m.id }),
  });
  expect(res.status).toBe(403);
});

test("管理员审核驳回并记录原因", async () => {
  const m = await makeMaterial({ status: "PENDING" });
  mockedAuth.mockResolvedValue({ user: { id: adminId, role: "ADMIN" } } as never);

  const form = new FormData();
  form.append("decision", "REJECTED");
  form.append("reviewNote", "版式有误，请重新导出");
  const res = await reviewApi(new Request("http://localhost", { method: "POST", body: form }), {
    params: Promise.resolve({ id: m.id }),
  });
  expect(res.status).toBe(200);

  const after = await prisma.speakerMaterial.findUnique({ where: { id: m.id } });
  expect(after?.status).toBe("REJECTED");
  expect(after?.reviewNote).toBe("版式有误，请重新导出");
  expect(after?.reviewedById).toBe(adminId);
  expect(after?.reviewedAt).not.toBeNull();
});

test("非管理员不能审核", async () => {
  const m = await makeMaterial({ status: "PENDING" });
  mockedAuth.mockResolvedValue({ user: { id: speakerUserId, role: "USER" } } as never);

  const form = new FormData();
  form.append("decision", "APPROVED");
  const res = await reviewApi(new Request("http://localhost", { method: "POST", body: form }), {
    params: Promise.resolve({ id: m.id }),
  });
  expect(res.status).toBe(403);
});
