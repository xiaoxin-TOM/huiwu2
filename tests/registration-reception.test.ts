import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { createRegistration, upsertRegistrationReception, updateRegistrationReception } from "@/lib/registrations";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/lib/auth";
import { POST as updateReceptionApi } from "@/app/api/admin/receptions/[id]/route";
import { POST as saveRegistrationReceptionApi } from "@/app/api/admin/registrations/[id]/reception/route";

const mockedAuth = vi.mocked(auth);

let userId: string;
let typeId: string;
let meetingId: string;
let registrationId: string;

beforeAll(async () => {
  const email = "reception-test@example.com";
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    await prisma.registrationReception.deleteMany({ where: { registration: { userId: existingUser.id } } });
    await prisma.registration.deleteMany({ where: { userId: existingUser.id } });
    await prisma.user.delete({ where: { id: existingUser.id } });
  }
  const u = await prisma.user.create({
    data: { name: "接待测试", email, passwordHash: "x", isActive: true },
  });
  userId = u.id;
  const t = await prisma.registrationType.create({ data: { name: "测试代表", fee: 0 } });
  typeId = t.id;
  const m = await prisma.meeting.create({ data: { title: "接待测试会议" } });
  meetingId = m.id;
  const reg = await createRegistration(userId, meetingId, {
    typeId,
    fullName: "报名人员甲",
    organization: "测试单位",
    title: "工程师",
    phone: "13800138000",
  });
  registrationId = reg.id;
  mockedAuth.mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
});

afterAll(async () => {
  await prisma.registrationReception.deleteMany({ where: { registration: { userId } } });
  await prisma.registration.deleteMany({ where: { userId } });
  await prisma.meeting.delete({ where: { id: meetingId } }).catch(() => {});
  await prisma.registrationType.delete({ where: { id: typeId } }).catch(() => {});
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await prisma.$disconnect();
});

const sampleReception = {
  arriveMode: "航班",
  arriveNo: "CA1234",
  arriveTime: "2026-08-01 10:00",
  arrivePlace: "首都机场 T3",
  departMode: "高铁",
  departNo: "G123",
  departTime: "2026-08-03 15:00",
  hotelName: "测试酒店",
  hotelRoom: "801",
  hotelCheckIn: "2026-08-01",
  hotelCheckOut: "2026-08-03",
  carPlate: "京A12345",
  carDriver: "王司机",
  carDriverPhone: "13900139000",
  carContact: "李接待",
  remark: "无",
};

test("upsertRegistrationReception 可创建并更新接待信息", async () => {
  const created = await upsertRegistrationReception(registrationId, sampleReception);
  expect(created.hotelRoom).toBe("801");
  expect(created.arriveMode).toBe("航班");

  const updated = await upsertRegistrationReception(registrationId, { ...sampleReception, hotelRoom: "802" });
  expect(updated.hotelRoom).toBe("802");
  expect(updated.id).toBe(created.id);
});

test("updateRegistrationReception 可通过 ID 更新接待信息", async () => {
  const reception = await prisma.registrationReception.findUnique({ where: { registrationId } });
  if (!reception) throw new Error("missing reception");
  const updated = await updateRegistrationReception(reception.id, { ...sampleReception, hotelRoom: "803" });
  expect(updated.hotelRoom).toBe("803");
});

test("POST /api/admin/registrations/[id]/reception 保存完整接待信息", async () => {
  const form = new FormData();
  Object.entries(sampleReception).forEach(([k, v]) => form.append(k, v));
  const req = new Request("http://localhost/api/admin/registrations/" + registrationId + "/reception", {
    method: "POST",
    body: form,
  });
  const res = await saveRegistrationReceptionApi(req, { params: Promise.resolve({ id: registrationId }) });
  expect(res.ok).toBe(true);

  const refreshed = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { reception: true },
  });
  expect(refreshed?.reception?.hotelName).toBe("测试酒店");
  expect(refreshed?.reception?.carPlate).toBe("京A12345");
});

test("POST /api/admin/receptions/[id] 可更新报名人员接待记录的房间号", async () => {
  const reception = await prisma.registrationReception.findUnique({ where: { registrationId } });
  if (!reception) throw new Error("missing reception");

  const form = new FormData();
  form.append("hotelRoom", "999");
  const req = new Request("http://localhost/api/admin/receptions/" + reception.id, {
    method: "POST",
    body: form,
  });
  const res = await updateReceptionApi(req, { params: Promise.resolve({ id: reception.id }) });
  expect(res.ok).toBe(true);

  const refreshed = await prisma.registrationReception.findUnique({ where: { id: reception.id } });
  expect(refreshed?.hotelRoom).toBe("999");
});
