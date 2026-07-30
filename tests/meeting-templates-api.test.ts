import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/lib/auth";
import { POST as templateApi } from "@/app/api/admin/meeting-templates/route";
import { DELETE as deleteTemplateApi } from "@/app/api/admin/meeting-templates/[id]/route";
import { POST as homeGridApi } from "@/app/api/admin/home-grid/route";
import { BUILTIN_MEETING_TEMPLATES } from "@/lib/meeting-templates";
import { listTemplateChoices } from "@/lib/meeting-templates-admin";

const mockedAuth = vi.mocked(auth);

let adminId: string;
let otherAdminId: string;
let meetingId: string;

function jsonReq(body: unknown) {
  return new Request("http://localhost/api/admin/meeting-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: `admin_meeting_id=${meetingId}` },
    body: JSON.stringify(body),
  });
}

beforeAll(async () => {
  for (const email of ["tpl-admin@example.com", "tpl-other@example.com"]) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      await prisma.meetingTemplate.deleteMany({ where: { ownerId: u.id } });
      await prisma.meeting.deleteMany({ where: { ownerId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
  }
  const admin = await prisma.user.create({
    data: { name: "模板管理员", email: "tpl-admin@example.com", passwordHash: "x", role: "ADMIN" },
  });
  adminId = admin.id;
  const other = await prisma.user.create({
    data: { name: "他人", email: "tpl-other@example.com", passwordHash: "x", role: "ADMIN" },
  });
  otherAdminId = other.id;

  const m = await prisma.meeting.create({ data: { title: "模板测试会议", ownerId: adminId } });
  meetingId = m.id;
});

beforeEach(async () => {
  mockedAuth.mockResolvedValue({ user: { id: adminId, role: "ADMIN" } } as never);
  await prisma.homeGridItem.deleteMany({ where: { meetingId } });
  await prisma.meetingTemplate.deleteMany({ where: { ownerId: { in: [adminId, otherAdminId] } } });
  await prisma.meeting.update({
    where: { id: meetingId },
    data: { homeGridColumns: 4, homeGridRounded: true, bgColor: "", bgImageUrl: null, bgOverlay: 0 },
  });
});

afterAll(async () => {
  await prisma.homeGridItem.deleteMany({ where: { meetingId } });
  await prisma.meetingTemplate.deleteMany({ where: { ownerId: { in: [adminId, otherAdminId] } } });
  await prisma.meeting.deleteMany({ where: { id: meetingId } });
  await prisma.user.deleteMany({ where: { id: { in: [adminId, otherAdminId] } } });
  await prisma.$disconnect();
});

test("套用内置模板写入宫格与外观", async () => {
  const tpl = BUILTIN_MEETING_TEMPLATES.find((t) => t.key === "expo")!;
  const res = await templateApi(jsonReq({ action: "apply", templateKey: "expo" }));
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.applied).toBe(tpl.items.length);

  const items = await prisma.homeGridItem.findMany({ where: { meetingId }, orderBy: { sortOrder: "asc" } });
  expect(items).toHaveLength(tpl.items.length);
  expect(items[0].title).toBe(tpl.items[0].title);

  const meeting = await prisma.meeting.findUniqueOrThrow({ where: { id: meetingId } });
  expect(meeting.homeGridColumns).toBe(tpl.gridColumns);
  expect(meeting.homeGridRounded).toBe(tpl.gridRounded);
  expect(meeting.bgColor).toBe(tpl.bgColor);
});

test("套用模板是替换而非追加", async () => {
  await templateApi(jsonReq({ action: "apply", templateKey: "academic" }));
  const first = await prisma.homeGridItem.count({ where: { meetingId } });

  await templateApi(jsonReq({ action: "apply", templateKey: "investment" }));
  const second = await prisma.homeGridItem.count({ where: { meetingId } });

  const tpl = BUILTIN_MEETING_TEMPLATES.find((t) => t.key === "investment")!;
  expect(second).toBe(tpl.items.length);
  expect(second).not.toBe(first);
});

test("套用模板不动业务数据", async () => {
  const type = await prisma.registrationType.create({ data: { name: `模板测试类型-${Date.now()}`, fee: 0 } });
  const user = await prisma.user.create({
    data: { name: "报名者", email: `tpl-reg-${Date.now()}@example.com`, passwordHash: "x" },
  });
  const reg = await prisma.registration.create({
    data: { userId: user.id, meetingId, typeId: type.id, fullName: "报名者", status: "APPROVED" },
  });

  await templateApi(jsonReq({ action: "apply", templateKey: "summit" }));

  const after = await prisma.registration.findUnique({ where: { id: reg.id } });
  expect(after?.status).toBe("APPROVED");

  await prisma.registration.delete({ where: { id: reg.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.registrationType.delete({ where: { id: type.id } });
});

test("未知模板 key 返回 404", async () => {
  const res = await templateApi(jsonReq({ action: "apply", templateKey: "no-such-template" }));
  expect(res.status).toBe(404);
});

test("另存为模板后可在列表里看到并再次套用", async () => {
  await templateApi(jsonReq({ action: "apply", templateKey: "forum" }));

  const saveRes = await templateApi(jsonReq({ action: "save", name: "我的论坛套路", description: "常用配置" }));
  expect(saveRes.status).toBe(200);
  const saved = await saveRes.json();

  const choices = await listTemplateChoices(adminId);
  const mine = choices.find((c) => c.id === saved.id);
  expect(mine?.name).toBe("我的论坛套路");
  expect(mine?.source).toBe("CUSTOM");
  expect(mine!.items.length).toBeGreaterThan(0);

  // 换个内置模板再套回自定义，应恢复成保存时的入口数
  await templateApi(jsonReq({ action: "apply", templateKey: "investment" }));
  const applyBack = await templateApi(jsonReq({ action: "apply", templateKey: `custom:${saved.id}` }));
  expect(applyBack.status).toBe(200);
  expect((await applyBack.json()).applied).toBe(mine!.items.length);
});

test("宫格为空时不能另存", async () => {
  const res = await templateApi(jsonReq({ action: "save", name: "空模板" }));
  expect(res.status).toBe(400);
});

test("模板名称必填", async () => {
  await templateApi(jsonReq({ action: "apply", templateKey: "forum" }));
  const res = await templateApi(jsonReq({ action: "save", name: "   " }));
  expect(res.status).toBe(400);
});

test("不能套用他人的自定义模板", async () => {
  await templateApi(jsonReq({ action: "apply", templateKey: "forum" }));
  const saveRes = await templateApi(jsonReq({ action: "save", name: "私有模板" }));
  const saved = await saveRes.json();

  mockedAuth.mockResolvedValue({ user: { id: otherAdminId, role: "ADMIN" } } as never);
  const res = await templateApi(jsonReq({ action: "apply", templateKey: `custom:${saved.id}` }));
  expect(res.status).toBe(404);
});

test("不能删除他人的模板", async () => {
  await templateApi(jsonReq({ action: "apply", templateKey: "forum" }));
  const saved = await (await templateApi(jsonReq({ action: "save", name: "私有模板" }))).json();

  mockedAuth.mockResolvedValue({ user: { id: otherAdminId, role: "ADMIN" } } as never);
  const res = await deleteTemplateApi(new Request("http://localhost", { method: "DELETE" }), {
    params: Promise.resolve({ id: saved.id }),
  });
  expect(res.status).toBe(404);
  expect(await prisma.meetingTemplate.findUnique({ where: { id: saved.id } })).not.toBeNull();
});

test("非管理员不能套用或另存", async () => {
  mockedAuth.mockResolvedValue({ user: { id: adminId, role: "USER" } } as never);
  expect((await templateApi(jsonReq({ action: "apply", templateKey: "forum" }))).status).toBe(403);
  expect((await templateApi(jsonReq({ action: "save", name: "x" }))).status).toBe(403);
});

test("宫格保存接口一并写入外观，并校验颜色格式", async () => {
  const items = [
    { title: "注册报名", href: "/register-conf", icon: "file", size: "SMALL", backgroundImage: "", isVisible: true },
  ];

  const bad = await homeGridApi(
    new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: `admin_meeting_id=${meetingId}` },
      body: JSON.stringify({ columns: 4, rounded: true, items, bgColor: "red; background: url(x)" }),
    }),
  );
  expect(bad.status).toBe(400);

  const ok = await homeGridApi(
    new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: `admin_meeting_id=${meetingId}` },
      body: JSON.stringify({
        columns: 3,
        rounded: false,
        items,
        bgColor: "#eef2ff",
        bgImageUrl: "/imgs/bg.jpg",
        bgOverlay: 40,
      }),
    }),
  );
  expect(ok.status).toBe(200);

  const meeting = await prisma.meeting.findUniqueOrThrow({ where: { id: meetingId } });
  expect(meeting.bgColor).toBe("#eef2ff");
  expect(meeting.bgImageUrl).toBe("/imgs/bg.jpg");
  expect(meeting.bgOverlay).toBe(40);
  expect(meeting.homeGridColumns).toBe(3);
  expect(meeting.homeGridRounded).toBe(false);
});

test("蒙版超过 80 被拒绝", async () => {
  const items = [
    { title: "注册报名", href: "/register-conf", icon: "file", size: "SMALL", backgroundImage: "", isVisible: true },
  ];
  const res = await homeGridApi(
    new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: `admin_meeting_id=${meetingId}` },
      body: JSON.stringify({ columns: 4, rounded: true, items, bgOverlay: 95 }),
    }),
  );
  expect(res.status).toBe(400);
});
