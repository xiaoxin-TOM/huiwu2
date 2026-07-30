import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/lib/auth";
import { POST as seatingApi } from "@/app/api/admin/seating/route";
import { POST as tableApi, DELETE as tableDeleteApi } from "@/app/api/admin/seating/[id]/route";
import { listSeatTables, listUnseated, assignSeat } from "@/lib/seating-admin";
import { findMySeat } from "@/lib/seating";

const mockedAuth = vi.mocked(auth);

let adminId: string;
let otherAdminId: string;
let attendeeId: string;
let meetingId: string;
let otherMeetingId: string;
let typeId: string;
let regId: string;
let guestId: string;
let outsideGuestId: string;

function jsonReq(body: unknown, meeting = meetingId) {
  return new Request("http://localhost/api/admin/seating", {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: `admin_meeting_id=${meeting}` },
    body: JSON.stringify(body),
  });
}

async function addTable(name: string, over: Record<string, unknown> = {}) {
  const res = await seatingApi(jsonReq({ action: "create-table", name, capacity: 10, ...over }));
  return { res, data: await res.json().catch(() => ({})) };
}

beforeAll(async () => {
  for (const email of ["seat-admin@example.com", "seat-other@example.com", "seat-user@example.com"]) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      await prisma.registration.deleteMany({ where: { userId: u.id } });
      await prisma.meeting.deleteMany({ where: { ownerId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
  }
  adminId = (await prisma.user.create({
    data: { name: "排座管理员", email: "seat-admin@example.com", passwordHash: "x", role: "ADMIN" },
  })).id;
  otherAdminId = (await prisma.user.create({
    data: { name: "他人", email: "seat-other@example.com", passwordHash: "x", role: "ADMIN" },
  })).id;
  attendeeId = (await prisma.user.create({
    data: { name: "参会者", email: "seat-user@example.com", passwordHash: "x" },
  })).id;

  meetingId = (await prisma.meeting.create({ data: { title: "排座测试会议", ownerId: adminId } })).id;
  otherMeetingId = (await prisma.meeting.create({ data: { title: "他人会议", ownerId: otherAdminId } })).id;

  typeId = (await prisma.registrationType.create({ data: { name: `排座类型-${Date.now()}`, fee: 0 } })).id;
  regId = (await prisma.registration.create({
    data: { userId: attendeeId, meetingId, typeId, fullName: "王参会", organization: "某公司", status: "APPROVED" },
  })).id;
  guestId = (await prisma.guest.create({ data: { meetingId, name: "李嘉宾", company: "某单位" } })).id;
  outsideGuestId = (await prisma.guest.create({ data: { meetingId: otherMeetingId, name: "外会议嘉宾" } })).id;
});

beforeEach(async () => {
  mockedAuth.mockResolvedValue({ user: { id: adminId, role: "ADMIN" } } as never);
  await prisma.seatAssignment.deleteMany({});
  await prisma.seatTable.deleteMany({ where: { meetingId: { in: [meetingId, otherMeetingId] } } });
  await prisma.meeting.update({ where: { id: meetingId }, data: { seatMapUrl: null, seatMapNote: "" } });
});

afterAll(async () => {
  await prisma.seatAssignment.deleteMany({});
  await prisma.seatTable.deleteMany({ where: { meetingId: { in: [meetingId, otherMeetingId] } } });
  await prisma.guest.deleteMany({ where: { meetingId: { in: [meetingId, otherMeetingId] } } });
  await prisma.registration.deleteMany({ where: { meetingId } });
  await prisma.meeting.deleteMany({ where: { id: { in: [meetingId, otherMeetingId] } } });
  await prisma.registrationType.delete({ where: { id: typeId } }).catch(() => {});
  await prisma.user.deleteMany({ where: { id: { in: [adminId, otherAdminId, attendeeId] } } });
  await prisma.$disconnect();
});

test("新增桌位，桌号在同一会议内唯一", async () => {
  const first = await addTable("1 号桌");
  expect(first.res.status).toBe(200);
  const dup = await addTable("1 号桌");
  expect(dup.res.status).toBe(409);
});

test("排座后未排座列表相应减少", async () => {
  const { data } = await addTable("1 号桌");
  expect((await listUnseated(meetingId)).map((p) => p.id).sort()).toEqual([guestId, regId].sort());

  const res = await seatingApi(jsonReq({ action: "assign", seatTableId: data.id, registrationId: regId }));
  expect(res.status).toBe(200);
  expect((await res.json()).outcome).toBe("OK");

  const remaining = await listUnseated(meetingId);
  expect(remaining.map((p) => p.id)).toEqual([guestId]);
});

test("换桌时自动清掉原座位，一人始终只占一个位置", async () => {
  const t1 = (await addTable("1 号桌")).data;
  const t2 = (await addTable("2 号桌")).data;

  await seatingApi(jsonReq({ action: "assign", seatTableId: t1.id, registrationId: regId }));
  const moved = await seatingApi(jsonReq({ action: "assign", seatTableId: t2.id, registrationId: regId }));
  expect((await moved.json()).outcome).toBe("MOVED");

  expect(await prisma.seatAssignment.count({ where: { registrationId: regId } })).toBe(1);
  const tables = await listSeatTables(meetingId);
  expect(tables.find((t) => t.id === t1.id)!.assignments).toHaveLength(0);
  expect(tables.find((t) => t.id === t2.id)!.assignments).toHaveLength(1);
});

test("重复排到同一桌只更新座次，不新增记录", async () => {
  const t1 = (await addTable("1 号桌")).data;
  await seatingApi(jsonReq({ action: "assign", seatTableId: t1.id, registrationId: regId, seatNo: 3 }));
  const again = await seatingApi(
    jsonReq({ action: "assign", seatTableId: t1.id, registrationId: regId, seatNo: 7 }),
  );
  expect((await again.json()).outcome).toBe("ALREADY_AT_TABLE");

  expect(await prisma.seatAssignment.count({ where: { registrationId: regId } })).toBe(1);
  const tables = await listSeatTables(meetingId);
  expect(tables[0].assignments[0].seatNo).toBe(7);
});

test("并发把同一人排到同一桌不会产生两条记录", async () => {
  const t1 = (await addTable("1 号桌")).data;
  await Promise.all(
    Array.from({ length: 5 }, () =>
      assignSeat({ seatTableId: t1.id, meetingId, registrationId: regId }).catch(() => "ERR"),
    ),
  );
  expect(await prisma.seatAssignment.count({ where: { registrationId: regId } })).toBe(1);
});

test("嘉宾也能排座，且与报名人员同桌共存", async () => {
  const t1 = (await addTable("1 号桌")).data;
  await seatingApi(jsonReq({ action: "assign", seatTableId: t1.id, registrationId: regId }));
  await seatingApi(jsonReq({ action: "assign", seatTableId: t1.id, guestId }));

  const tables = await listSeatTables(meetingId);
  expect(tables[0].assignments).toHaveLength(2);
  expect(tables[0].assignments.map((a) => a.kind).sort()).toEqual(["guest", "registration"]);
  expect(tables[0].assignments.map((a) => a.name).sort()).toEqual(["王参会", "李嘉宾"].sort());
});

test("不能把其他会议的人排进来", async () => {
  const t1 = (await addTable("1 号桌")).data;
  const res = await seatingApi(jsonReq({ action: "assign", seatTableId: t1.id, guestId: outsideGuestId }));
  expect(res.status).toBe(404);
  expect(await prisma.seatAssignment.count()).toBe(0);
});

test("同时指定嘉宾与报名人员被拒", async () => {
  const t1 = (await addTable("1 号桌")).data;
  const res = await seatingApi(jsonReq({ action: "assign", seatTableId: t1.id, registrationId: regId, guestId }));
  expect(res.status).toBe(400);
});

test("移除排座后此人回到未排座列表", async () => {
  const t1 = (await addTable("1 号桌")).data;
  await seatingApi(jsonReq({ action: "assign", seatTableId: t1.id, registrationId: regId }));
  const assignment = await prisma.seatAssignment.findFirstOrThrow({ where: { registrationId: regId } });

  const res = await seatingApi(jsonReq({ action: "unassign", id: assignment.id }));
  expect(res.status).toBe(200);
  expect((await listUnseated(meetingId)).map((p) => p.id).sort()).toEqual([guestId, regId].sort());
});

test("删除桌位会连带清掉其排座", async () => {
  const t1 = (await addTable("1 号桌")).data;
  await seatingApi(jsonReq({ action: "assign", seatTableId: t1.id, registrationId: regId }));

  const res = await tableDeleteApi(new Request("http://localhost", { method: "DELETE" }), {
    params: Promise.resolve({ id: t1.id }),
  });
  expect(res.status).toBe(200);
  expect(await prisma.seatAssignment.count({ where: { registrationId: regId } })).toBe(0);
});

test("平面图只接受合法地址", async () => {
  const bad = await seatingApi(jsonReq({ action: "seat-map", seatMapUrl: "javascript:alert(1)" }));
  expect(bad.status).toBe(400);

  const ok = await seatingApi(
    jsonReq({ action: "seat-map", seatMapUrl: "/imgs/seatmap.png", seatMapNote: "舞台在上方" }),
  );
  expect(ok.status).toBe(200);
  const meeting = await prisma.meeting.findUniqueOrThrow({ where: { id: meetingId } });
  expect(meeting.seatMapUrl).toBe("/imgs/seatmap.png");
  expect(meeting.seatMapNote).toBe("舞台在上方");
});

test("前台查座能拿到桌号与同桌人", async () => {
  const t1 = (await addTable("3 号桌", { area: "主宴会厅" })).data;
  await seatingApi(jsonReq({ action: "assign", seatTableId: t1.id, registrationId: regId, seatNo: 5 }));
  await seatingApi(jsonReq({ action: "assign", seatTableId: t1.id, guestId }));

  const mine = findMySeat(await listSeatTables(meetingId), { registrationId: regId, guestId: null });
  expect(mine?.table.name).toBe("3 号桌");
  expect(mine?.table.area).toBe("主宴会厅");
  expect(mine?.mine.seatNo).toBe(5);
  expect(mine?.tableMates.map((m) => m.name)).toEqual(["李嘉宾"]);
  // 富化字段透传到前台，类型不退化
  expect(mine?.tableMates[0].org).toBe("某单位");
});

test("其他会议的管理员不能改删本会议桌位", async () => {
  const t1 = (await addTable("1 号桌")).data;
  mockedAuth.mockResolvedValue({ user: { id: otherAdminId, role: "ADMIN" } } as never);

  const upd = await tableApi(jsonReq({ name: "改名", capacity: 8 }), {
    params: Promise.resolve({ id: t1.id }),
  });
  expect(upd.status).toBe(403);

  const del = await tableDeleteApi(new Request("http://localhost", { method: "DELETE" }), {
    params: Promise.resolve({ id: t1.id }),
  });
  expect(del.status).toBe(403);
});

test("跨会议排座被拒：桌位不属于当前会议", async () => {
  const t1 = (await addTable("1 号桌")).data;
  mockedAuth.mockResolvedValue({ user: { id: otherAdminId, role: "ADMIN" } } as never);
  const res = await seatingApi(
    jsonReq({ action: "assign", seatTableId: t1.id, registrationId: regId }, otherMeetingId),
  );
  expect(res.status).toBe(404);
});

test("非管理员一律拒绝", async () => {
  mockedAuth.mockResolvedValue({ user: { id: attendeeId, role: "USER" } } as never);
  expect((await addTable("1 号桌")).res.status).toBe(403);
});

test("桌号必填", async () => {
  const res = await seatingApi(jsonReq({ action: "create-table", name: "  ", capacity: 10 }));
  expect(res.status).toBe(400);
});
