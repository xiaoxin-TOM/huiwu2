import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { createRegistration } from "@/lib/registrations";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/lib/auth";
import { POST as bulkApi } from "@/app/api/admin/receptions/bulk/route";
import { POST as updateReceptionApi } from "@/app/api/admin/receptions/[id]/route";

const mockedAuth = vi.mocked(auth);

let adminId: string;
let userId: string;
let otherUserId: string;
let typeId: string;
let meetingId: string;
let otherMeetingId: string;
let registrationId: string;
let guestWithReceptionId: string;
let guestWithoutReceptionId: string;
let outsideGuestId: string;

function bulkRequest(body: unknown) {
  return new Request("http://localhost/api/admin/receptions/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: `admin_meeting_id=${meetingId}` },
    body: JSON.stringify(body),
  });
}

beforeAll(async () => {
  for (const email of ["bulk-admin@example.com", "bulk-user@example.com", "bulk-other@example.com"]) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      await prisma.registrationReception.deleteMany({ where: { registration: { userId: u.id } } });
      await prisma.registration.deleteMany({ where: { userId: u.id } });
      await prisma.meeting.deleteMany({ where: { ownerId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
  }

  const admin = await prisma.user.create({
    data: { name: "批量管理员", email: "bulk-admin@example.com", passwordHash: "x", role: "ADMIN" },
  });
  adminId = admin.id;
  const u = await prisma.user.create({
    data: { name: "批量报名人", email: "bulk-user@example.com", passwordHash: "x" },
  });
  userId = u.id;
  const other = await prisma.user.create({
    data: { name: "他人管理员", email: "bulk-other@example.com", passwordHash: "x", role: "ADMIN" },
  });
  otherUserId = other.id;

  const t = await prisma.registrationType.create({ data: { name: `批量测试类型-${Date.now()}`, fee: 0 } });
  typeId = t.id;

  const m = await prisma.meeting.create({ data: { title: "批量接待测试会议", ownerId: adminId } });
  meetingId = m.id;
  const om = await prisma.meeting.create({ data: { title: "他人会议", ownerId: otherUserId } });
  otherMeetingId = om.id;

  const reg = await createRegistration(userId, meetingId, {
    typeId,
    fullName: "报名人员甲",
    organization: "测试单位",
    title: "工程师",
    phone: "13800138000",
  });
  registrationId = reg.id;

  const g1 = await prisma.guest.create({
    data: {
      meetingId,
      name: "嘉宾甲",
      company: "甲单位",
      reception: { create: { hotelName: "已安排酒店", carDriver: "" } },
    },
  });
  guestWithReceptionId = g1.id;

  const g2 = await prisma.guest.create({ data: { meetingId, name: "嘉宾乙", company: "乙单位" } });
  guestWithoutReceptionId = g2.id;

  const g3 = await prisma.guest.create({ data: { meetingId: otherMeetingId, name: "外会议嘉宾" } });
  outsideGuestId = g3.id;

  mockedAuth.mockResolvedValue({ user: { id: adminId, role: "ADMIN" } } as never);
});

beforeEach(() => {
  mockedAuth.mockResolvedValue({ user: { id: adminId, role: "ADMIN" } } as never);
});

afterAll(async () => {
  await prisma.guest.deleteMany({ where: { meetingId: { in: [meetingId, otherMeetingId] } } });
  await prisma.registrationReception.deleteMany({ where: { registration: { userId } } });
  await prisma.registration.deleteMany({ where: { userId } });
  await prisma.meeting.deleteMany({ where: { id: { in: [meetingId, otherMeetingId] } } });
  await prisma.registrationType.delete({ where: { id: typeId } }).catch(() => {});
  await prisma.user.deleteMany({ where: { id: { in: [adminId, userId, otherUserId] } } });
  await prisma.$disconnect();
});

test("仅填空白项：为无接待记录的人新建，跳过已有值", async () => {
  const res = await bulkApi(
    bulkRequest({
      mode: "FILL_EMPTY",
      targets: [
        { kind: "guest", id: guestWithReceptionId },
        { kind: "guest", id: guestWithoutReceptionId },
        { kind: "registration", id: registrationId },
      ],
      fields: { hotelName: "锦江国际", hotelCheckIn: "2026-08-11" },
    }),
  );
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.ok).toBe(true);
  expect(data.created).toBe(2); // 嘉宾乙 + 报名人员甲
  expect(data.updated).toBe(1); // 嘉宾甲已有记录，但 hotelCheckIn 是空的

  const kept = await prisma.guestReception.findUnique({ where: { guestId: guestWithReceptionId } });
  expect(kept?.hotelName).toBe("已安排酒店"); // 已有值未被覆盖
  expect(kept?.hotelCheckIn).toBe("2026-08-11"); // 空字段被补上

  const fresh = await prisma.guestReception.findUnique({ where: { guestId: guestWithoutReceptionId } });
  expect(fresh?.hotelName).toBe("锦江国际");

  const reg = await prisma.registrationReception.findUnique({ where: { registrationId } });
  expect(reg?.hotelName).toBe("锦江国际");
});

test("覆盖已有值：连同已安排的一起改写", async () => {
  const res = await bulkApi(
    bulkRequest({
      mode: "OVERWRITE",
      targets: [{ kind: "guest", id: guestWithReceptionId }],
      fields: { hotelName: "临时换的酒店" },
    }),
  );
  expect(res.status).toBe(200);
  await expect(res.json()).resolves.toMatchObject({ ok: true, updated: 1 });

  const row = await prisma.guestReception.findUnique({ where: { guestId: guestWithReceptionId } });
  expect(row?.hotelName).toBe("临时换的酒店");
  expect(row?.hotelCheckIn).toBe("2026-08-11"); // 未勾选的字段不受影响
});

test("未勾选的字段不会被清空", async () => {
  await bulkApi(
    bulkRequest({
      mode: "OVERWRITE",
      targets: [{ kind: "guest", id: guestWithoutReceptionId }],
      fields: { carDriver: "王司机" },
    }),
  );
  const row = await prisma.guestReception.findUnique({ where: { guestId: guestWithoutReceptionId } });
  expect(row?.carDriver).toBe("王司机");
  expect(row?.hotelName).toBe("锦江国际");
});

test("其他会议的人员被拒绝处理", async () => {
  const res = await bulkApi(
    bulkRequest({
      mode: "OVERWRITE",
      targets: [{ kind: "guest", id: outsideGuestId }],
      fields: { hotelName: "越界写入" },
    }),
  );
  const data = await res.json();
  expect(data.rejected).toBe(1);
  expect(data.created + data.updated).toBe(0);
  const row = await prisma.guestReception.findUnique({ where: { guestId: outsideGuestId } });
  expect(row).toBeNull();
});

test("未勾选任何字段时报错", async () => {
  const res = await bulkApi(
    bulkRequest({ mode: "OVERWRITE", targets: [{ kind: "guest", id: guestWithReceptionId }], fields: {} }),
  );
  expect(res.status).toBe(400);
  await expect(res.json()).resolves.toMatchObject({ ok: false });
});

test("未选择人员时报错", async () => {
  const res = await bulkApi(bulkRequest({ mode: "OVERWRITE", targets: [], fields: { hotelName: "x" } }));
  expect(res.status).toBe(400);
});

test("非管理员被拒绝", async () => {
  mockedAuth.mockResolvedValue({ user: { id: userId, role: "USER" } } as never);
  const res = await bulkApi(
    bulkRequest({
      mode: "OVERWRITE",
      targets: [{ kind: "guest", id: guestWithReceptionId }],
      fields: { hotelName: "x" },
    }),
  );
  expect(res.status).toBe(403);
});

test("单条更新只写入表单实际提交的字段，不清空其余接待信息", async () => {
  const reception = await prisma.guestReception.update({
    where: { guestId: guestWithReceptionId },
    data: {
      hotelName: "锦江国际",
      arriveMode: "航班",
      arriveNo: "CA1234",
      carDriver: "王司机",
      remark: "重要嘉宾",
    },
  });

  const form = new FormData();
  form.append("hotelRoom", "801");
  const res = await updateReceptionApi(
    new Request(`http://localhost/api/admin/receptions/${reception.id}`, { method: "POST", body: form }),
    { params: Promise.resolve({ id: reception.id }) },
  );
  expect(res.status).toBe(200);

  const after = await prisma.guestReception.findUnique({ where: { id: reception.id } });
  expect(after?.hotelRoom).toBe("801");
  expect(after?.hotelName).toBe("锦江国际");
  expect(after?.arriveMode).toBe("航班");
  expect(after?.arriveNo).toBe("CA1234");
  expect(after?.carDriver).toBe("王司机");
  expect(after?.remark).toBe("重要嘉宾");
});

test("单条更新拒绝跨会议的接待记录", async () => {
  const outside = await prisma.guestReception.create({ data: { guestId: outsideGuestId, hotelName: "他人酒店" } });
  const form = new FormData();
  form.append("hotelRoom", "999");
  const res = await updateReceptionApi(
    new Request(`http://localhost/api/admin/receptions/${outside.id}`, { method: "POST", body: form }),
    { params: Promise.resolve({ id: outside.id }) },
  );
  expect(res.status).toBe(403);

  const after = await prisma.guestReception.findUnique({ where: { id: outside.id } });
  expect(after?.hotelRoom).toBe("");
  expect(after?.hotelName).toBe("他人酒店");
});
