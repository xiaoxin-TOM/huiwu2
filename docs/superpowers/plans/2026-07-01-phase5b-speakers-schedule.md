# 阶段五·乙:讲者管理 + 日程管理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 第五期(后台完善)第二批:让管理员在后台增删改查讲者/主持人,以及增删改查日程场次并为场次指派讲者/主持人。前台讲者查询与日程页(第二期已建)随之有了可维护的数据。

**Architecture:** 沿用既有范式。后台页 `/admin/*` 由 middleware 守卫;写经 Route Handler,**每个 `/api/admin/*` handler 第一条即 `isAdmin` 守卫(403)**;原生 HTML `<form method="post">` 提交后 `303` 重定向。读用 Server Component + 领域函数。业务逻辑抽 `src/lib/*-admin.ts` 并 TDD。

**Tech Stack:** Next.js 16、Prisma 7、Auth.js v5、zod、Tailwind、Vitest。

## Global Constraints

- 单会议系统;全部中文 UI 文案。
- **`/api/admin/*` 必须在 handler 内 `isAdmin(session?.user?.role)` 守卫(403)作为第一条语句**(middleware 只覆盖 `/admin/:path*` 页面),在 `await ctx.params` / 读 formData / 任何写之前。
- 写经 Route Handler;zod 校验;统一 `{ ok:false, error }`;DB 写包 try/catch(create→500,update/delete/assign→400);成功 `303` 重定向回对应后台列表。
- Next.js 16:动态路由 `params`、`RouteContext<'…'>.params` 为 Promise,必须 `await`;写 Next 代码前读 `node_modules/next/dist/docs/`。
- checkbox 解析:`form?.get("x") === "on"`(未勾选不发送该字段 → false)。
- 读用 Server Component + `prisma`/领域函数;富文本(讲者 bio)前台经 `RichText` 渲染(第二期已就绪)。
- 测试用独立测试库(`.env.test`→test.db),自建并清理。外键:`SessionSpeaker.session`/`.speaker` 均为 `Cascade`(删场次/讲者连带删关联)。复合主键 `@@id([sessionId, speakerId, role])`,Prisma 复合定位用 `sessionId_speakerId_role`。
- 提交信息中文,结尾 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`。
- 禁止提交 `.env`、`.env.test`、`*.db`、`public/uploads/*`、`.superpowers/`。
- 复用:`src/lib/speakers.ts`(`getAllSpeakers` name 升序、`getSpeakerById`)不改,新增 `speakers-admin.ts`;`src/lib/schedule.ts`(`SessionWithSpeakers` 等)不改,新增 `schedule-admin.ts`;`isAdmin`、`auth`;`(admin)` 布局 MENU 已含 `/admin/speakers`、`/admin/schedule`。

## File Structure

- `src/lib/validation.ts` — 修改。新增 `speakerSchema`、`sessionSchema`、`sessionSpeakerSchema`。
- `src/lib/speakers-admin.ts` — 创建。`createSpeaker`/`updateSpeaker`/`deleteSpeaker`。
- `src/app/api/admin/speakers/route.ts`、`.../speakers/[id]/route.ts`、`.../speakers/[id]/delete/route.ts` — 创建。
- `src/app/(admin)/admin/speakers/page.tsx`、`.../speakers/[id]/page.tsx` — 创建。
- `src/lib/schedule-admin.ts` — 创建。场次 CRUD + 讲者指派。
- `src/app/api/admin/sessions/route.ts`、`.../sessions/[id]/route.ts`、`.../sessions/[id]/delete/route.ts`、`.../sessions/[id]/speakers/route.ts`、`.../sessions/[id]/speakers/delete/route.ts` — 创建。
- `src/app/(admin)/admin/schedule/page.tsx`、`.../schedule/[id]/page.tsx` — 创建。
- `tests/speakers-admin.test.ts`、`tests/schedule-admin.test.ts` — 创建。

---

### Task 1: 讲者管理(/admin/speakers CRUD)

**Files:**
- Modify: `src/lib/validation.ts`
- Create: `src/lib/speakers-admin.ts`
- Create: `src/app/api/admin/speakers/route.ts`、`src/app/api/admin/speakers/[id]/route.ts`、`src/app/api/admin/speakers/[id]/delete/route.ts`
- Create: `src/app/(admin)/admin/speakers/page.tsx`、`src/app/(admin)/admin/speakers/[id]/page.tsx`
- Create: `tests/speakers-admin.test.ts`

**Interfaces:**
- Produces:
  - `speakerSchema`(`name` 必填;`title`/`organization`/`bio`/`photoUrl` 可选默认 "";`isModerator` 布尔)。
  - `createSpeaker(data): Promise<Speaker>`、`updateSpeaker(id, data): Promise<Speaker>`、`deleteSpeaker(id): Promise<Speaker>`(`data` 为 `{ name, title, organization, bio, photoUrl, isModerator }`)。
- Consumes: `getAllSpeakers`、`getSpeakerById`(来自 `@/lib/speakers`)。

- [ ] **Step 1: 为讲者后台领域函数写失败测试**

创建 `tests/speakers-admin.test.ts`:

```ts
import { afterAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import { getSpeakerById } from "@/lib/speakers";
import { createSpeaker, updateSpeaker, deleteSpeaker } from "@/lib/speakers-admin";

const ids: string[] = [];

afterAll(async () => {
  await prisma.speaker.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

test("建→改→删 讲者", async () => {
  const s = await createSpeaker({
    name: "测试讲者", title: "教授", organization: "测试大学", bio: "<p>简介</p>",
    photoUrl: "", isModerator: false,
  });
  ids.push(s.id);
  expect(s.name).toBe("测试讲者");
  expect(s.isModerator).toBe(false);

  const up = await updateSpeaker(s.id, {
    name: "测试讲者", title: "主任", organization: "测试大学", bio: "<p>新简介</p>",
    photoUrl: "", isModerator: true,
  });
  expect(up.title).toBe("主任");
  expect(up.isModerator).toBe(true);

  await deleteSpeaker(s.id);
  expect(await getSpeakerById(s.id)).toBeNull();
});
```

- [ ] **Step 2: 运行测试,确认失败**

Run: `npm test -- tests/speakers-admin.test.ts`
Expected: FAIL,无法解析 `@/lib/speakers-admin`。

- [ ] **Step 3: 追加 `speakerSchema` 到 `src/lib/validation.ts`**

```ts
export const speakerSchema = z.object({
  name: z.string().min(1, "请填写姓名"),
  title: z.string().optional().default(""),
  organization: z.string().optional().default(""),
  bio: z.string().optional().default(""),
  photoUrl: z.string().optional().default(""),
  isModerator: z.boolean(),
});
```

- [ ] **Step 4: 实现 `src/lib/speakers-admin.ts`**

```ts
import { prisma } from "@/lib/prisma";

type SpeakerData = {
  name: string;
  title: string;
  organization: string;
  bio: string;
  photoUrl: string;
  isModerator: boolean;
};

export function createSpeaker(data: SpeakerData) {
  return prisma.speaker.create({ data });
}

export function updateSpeaker(id: string, data: SpeakerData) {
  return prisma.speaker.update({ where: { id }, data });
}

export function deleteSpeaker(id: string) {
  return prisma.speaker.delete({ where: { id } });
}
```

- [ ] **Step 5: 运行测试,确认通过**

Run: `npm test -- tests/speakers-admin.test.ts`
Expected: PASS。

- [ ] **Step 6: 新建讲者 API `src/app/api/admin/speakers/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { speakerSchema } from "@/lib/validation";
import { createSpeaker } from "@/lib/speakers-admin";

function parse(form: FormData | null) {
  return speakerSchema.safeParse({
    name: form?.get("name") ?? "",
    title: form?.get("title") ?? "",
    organization: form?.get("organization") ?? "",
    bio: form?.get("bio") ?? "",
    photoUrl: form?.get("photoUrl") ?? "",
    isModerator: form?.get("isModerator") === "on",
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const form = await req.formData().catch(() => null);
  const parsed = parse(form);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await createSpeaker(parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "创建失败" }, { status: 500 });
  }
  return NextResponse.redirect(new URL("/admin/speakers", req.url), { status: 303 });
}
```

(说明:`parse(form)` 仅本文件内辅助;更新接口里也用同样字段读取,见 Step 7。)

- [ ] **Step 7: 更新讲者 API `src/app/api/admin/speakers/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { speakerSchema } from "@/lib/validation";
import { updateSpeaker } from "@/lib/speakers-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/speakers/[id]">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const parsed = speakerSchema.safeParse({
    name: form?.get("name") ?? "",
    title: form?.get("title") ?? "",
    organization: form?.get("organization") ?? "",
    bio: form?.get("bio") ?? "",
    photoUrl: form?.get("photoUrl") ?? "",
    isModerator: form?.get("isModerator") === "on",
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await updateSpeaker(id, parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "更新失败" }, { status: 400 });
  }
  return NextResponse.redirect(new URL("/admin/speakers", req.url), { status: 303 });
}
```

- [ ] **Step 8: 删除讲者 API `src/app/api/admin/speakers/[id]/delete/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { deleteSpeaker } from "@/lib/speakers-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/speakers/[id]/delete">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    await deleteSpeaker(id);
  } catch {
    return NextResponse.json({ ok: false, error: "删除失败" }, { status: 400 });
  }
  return NextResponse.redirect(new URL("/admin/speakers", req.url), { status: 303 });
}
```

- [ ] **Step 9: 讲者列表+新建页 `src/app/(admin)/admin/speakers/page.tsx`**

```tsx
import Link from "next/link";
import { getAllSpeakers } from "@/lib/speakers";

export default async function AdminSpeakersPage() {
  const speakers = await getAllSpeakers();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">讲者管理</h1>

      <form action="/api/admin/speakers" method="post" className="space-y-2 rounded border p-4">
        <h2 className="font-medium">新建讲者</h2>
        <input name="name" required placeholder="姓名" className="w-full rounded border px-3 py-2" />
        <input name="title" placeholder="职称" className="w-full rounded border px-3 py-2" />
        <input name="organization" placeholder="单位" className="w-full rounded border px-3 py-2" />
        <input name="photoUrl" placeholder="照片地址(可选)" className="w-full rounded border px-3 py-2" />
        <textarea name="bio" rows={3} placeholder="简介(HTML)" className="w-full rounded border px-3 py-2 font-mono text-sm" />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" name="isModerator" /> 主持人
        </label>
        <button type="submit" className="rounded bg-sky-700 px-4 py-2 text-sm text-white">新建</button>
      </form>

      {speakers.length === 0 ? (
        <p className="text-gray-500">暂无讲者。</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">姓名</th><th>职称</th><th>单位</th><th>角色</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {speakers.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="py-2">{s.name}</td>
                <td>{s.title}</td>
                <td>{s.organization}</td>
                <td>{s.isModerator ? "主持人" : "讲者"}</td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <Link href={`/admin/speakers/${s.id}`} className="text-sky-700 hover:underline">编辑</Link>
                    <form action={`/api/admin/speakers/${s.id}/delete`} method="post">
                      <button type="submit" className="text-red-600 hover:underline">删除</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 10: 讲者编辑页 `src/app/(admin)/admin/speakers/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getSpeakerById } from "@/lib/speakers";

export default async function EditSpeakerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSpeakerById(id);
  if (!s) notFound();
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">编辑讲者</h1>
      <form action={`/api/admin/speakers/${s.id}`} method="post" className="space-y-3">
        <input name="name" required defaultValue={s.name} className="w-full rounded border px-3 py-2" />
        <input name="title" defaultValue={s.title} placeholder="职称" className="w-full rounded border px-3 py-2" />
        <input name="organization" defaultValue={s.organization} placeholder="单位" className="w-full rounded border px-3 py-2" />
        <input name="photoUrl" defaultValue={s.photoUrl ?? ""} placeholder="照片地址" className="w-full rounded border px-3 py-2" />
        <textarea name="bio" rows={5} defaultValue={s.bio} className="w-full rounded border px-3 py-2 font-mono text-sm" />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" name="isModerator" defaultChecked={s.isModerator} /> 主持人
        </label>
        <button type="submit" className="rounded bg-sky-700 px-4 py-2 text-white">保存</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 11: 构建 + 全量测试**

Run: `npm run build && npm test`
Expected: 构建成功,`/admin/speakers`、`/admin/speakers/[id]`、三个 `/api/admin/speakers/...` 出现;测试全 PASS(新增 speakers-admin 1)。

- [ ] **Step 12: 提交**

```bash
git add src/lib/validation.ts src/lib/speakers-admin.ts src/app/api/admin/speakers \
  "src/app/(admin)/admin/speakers" tests/speakers-admin.test.ts
git commit -m "feat: 后台讲者管理(增删改查)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: 日程管理(/admin/schedule CRUD + 指派讲者)

**Files:**
- Modify: `src/lib/validation.ts`
- Create: `src/lib/schedule-admin.ts`
- Create: `src/app/api/admin/sessions/route.ts`、`.../sessions/[id]/route.ts`、`.../sessions/[id]/delete/route.ts`、`.../sessions/[id]/speakers/route.ts`、`.../sessions/[id]/speakers/delete/route.ts`
- Create: `src/app/(admin)/admin/schedule/page.tsx`、`src/app/(admin)/admin/schedule/[id]/page.tsx`
- Create: `tests/schedule-admin.test.ts`

**Interfaces:**
- Produces:
  - `sessionSchema`(`day`/`startTime`/`endTime`/`title` 必填;`room` 可选默认 "";`isBrief` 布尔)。
  - `sessionSpeakerSchema`(`speakerId` 必填;`role` 枚举 `SPEAKER|MODERATOR`)。
  - `listSessionsAdmin(): Promise<SessionWithSpeakers[]>`(day、startTime 升序,include speakers→speaker)。
  - `getSessionAdmin(id): Promise<SessionWithSpeakers | null>`。
  - `createSession(data)`、`updateSession(id, data)`、`deleteSession(id)`(`data` 为 session 字段)。
  - `addSessionSpeaker(sessionId, speakerId, role)` — 复合主键冲突(已存在)抛 `DUPLICATE_LINK`。
  - `removeSessionSpeaker(sessionId, speakerId, role)`。
  - 复用 `SessionWithSpeakers`(`@/lib/schedule`)、`getAllSpeakers`(`@/lib/speakers`)。
- Consumes: `prisma`、`getAllSpeakers`。

- [ ] **Step 1: 为日程后台领域函数写失败测试**

创建 `tests/schedule-admin.test.ts`:

```ts
import { afterAll, beforeAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  updateSession,
  deleteSession,
  getSessionAdmin,
  addSessionSpeaker,
  removeSessionSpeaker,
} from "@/lib/schedule-admin";

let speakerId: string;
const sessionIds: string[] = [];

beforeAll(async () => {
  const s = await prisma.speaker.create({ data: { name: "日程测试讲者" } });
  speakerId = s.id;
});

afterAll(async () => {
  // Session/Speaker 删除时 SessionSpeaker 因 Cascade 自动清理
  await prisma.session.deleteMany({ where: { id: { in: sessionIds } } });
  await prisma.speaker.delete({ where: { id: speakerId } }).catch(() => {});
  await prisma.$disconnect();
});

test("建场次→改→指派讲者→读→撤销→删", async () => {
  const sess = await createSession({
    day: "2026-09-18", startTime: "09:00", endTime: "10:00",
    room: "主会场", title: "测试场次", isBrief: true,
  });
  sessionIds.push(sess.id);
  expect(sess.title).toBe("测试场次");

  const up = await updateSession(sess.id, {
    day: "2026-09-18", startTime: "09:00", endTime: "10:30",
    room: "主会场", title: "测试场次改", isBrief: false,
  });
  expect(up.endTime).toBe("10:30");
  expect(up.isBrief).toBe(false);

  await addSessionSpeaker(sess.id, speakerId, "SPEAKER");
  const full = await getSessionAdmin(sess.id);
  expect(full?.speakers).toHaveLength(1);
  expect(full?.speakers[0].speaker.name).toBe("日程测试讲者");
  expect(full?.speakers[0].role).toBe("SPEAKER");

  await expect(addSessionSpeaker(sess.id, speakerId, "SPEAKER")).rejects.toThrow("DUPLICATE_LINK");

  await removeSessionSpeaker(sess.id, speakerId, "SPEAKER");
  expect((await getSessionAdmin(sess.id))?.speakers).toHaveLength(0);

  await deleteSession(sess.id);
  expect(await getSessionAdmin(sess.id)).toBeNull();
});
```

- [ ] **Step 2: 运行测试,确认失败**

Run: `npm test -- tests/schedule-admin.test.ts`
Expected: FAIL,无法解析 `@/lib/schedule-admin`。

- [ ] **Step 3: 追加 schema 到 `src/lib/validation.ts`**

```ts
export const sessionSchema = z.object({
  day: z.string().min(1, "请填写日期"),
  startTime: z.string().min(1, "请填写开始时间"),
  endTime: z.string().min(1, "请填写结束时间"),
  room: z.string().optional().default(""),
  title: z.string().min(1, "请填写标题"),
  isBrief: z.boolean(),
});

export const sessionSpeakerSchema = z.object({
  speakerId: z.string().min(1, "请选择讲者"),
  role: z.enum(["SPEAKER", "MODERATOR"]),
});
```

- [ ] **Step 4: 实现 `src/lib/schedule-admin.ts`**

```ts
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionWithSpeakers } from "@/lib/schedule";

type SessionData = {
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  title: string;
  isBrief: boolean;
};

const include = { speakers: { include: { speaker: true } } } as const;

export function listSessionsAdmin(): Promise<SessionWithSpeakers[]> {
  return prisma.session.findMany({
    include,
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  });
}

export function getSessionAdmin(id: string): Promise<SessionWithSpeakers | null> {
  return prisma.session.findUnique({ where: { id }, include });
}

export function createSession(data: SessionData) {
  return prisma.session.create({ data });
}

export function updateSession(id: string, data: SessionData) {
  return prisma.session.update({ where: { id }, data });
}

export function deleteSession(id: string) {
  return prisma.session.delete({ where: { id } });
}

export async function addSessionSpeaker(sessionId: string, speakerId: string, role: string) {
  try {
    return await prisma.sessionSpeaker.create({ data: { sessionId, speakerId, role } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error("DUPLICATE_LINK");
    }
    throw e;
  }
}

export function removeSessionSpeaker(sessionId: string, speakerId: string, role: string) {
  return prisma.sessionSpeaker.delete({
    where: { sessionId_speakerId_role: { sessionId, speakerId, role } },
  });
}
```

- [ ] **Step 5: 运行测试,确认通过**

Run: `npm test -- tests/schedule-admin.test.ts`
Expected: PASS。

- [ ] **Step 6: 新建场次 API `src/app/api/admin/sessions/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { sessionSchema } from "@/lib/validation";
import { createSession } from "@/lib/schedule-admin";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const form = await req.formData().catch(() => null);
  const parsed = sessionSchema.safeParse({
    day: form?.get("day") ?? "",
    startTime: form?.get("startTime") ?? "",
    endTime: form?.get("endTime") ?? "",
    room: form?.get("room") ?? "",
    title: form?.get("title") ?? "",
    isBrief: form?.get("isBrief") === "on",
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await createSession(parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "创建失败" }, { status: 500 });
  }
  return NextResponse.redirect(new URL("/admin/schedule", req.url), { status: 303 });
}
```

- [ ] **Step 7: 更新场次 API `src/app/api/admin/sessions/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { sessionSchema } from "@/lib/validation";
import { updateSession } from "@/lib/schedule-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/sessions/[id]">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const parsed = sessionSchema.safeParse({
    day: form?.get("day") ?? "",
    startTime: form?.get("startTime") ?? "",
    endTime: form?.get("endTime") ?? "",
    room: form?.get("room") ?? "",
    title: form?.get("title") ?? "",
    isBrief: form?.get("isBrief") === "on",
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await updateSession(id, parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "更新失败" }, { status: 400 });
  }
  return NextResponse.redirect(new URL(`/admin/schedule/${id}`, req.url), { status: 303 });
}
```

- [ ] **Step 8: 删除场次 API `src/app/api/admin/sessions/[id]/delete/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { deleteSession } from "@/lib/schedule-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/sessions/[id]/delete">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    await deleteSession(id);
  } catch {
    return NextResponse.json({ ok: false, error: "删除失败" }, { status: 400 });
  }
  return NextResponse.redirect(new URL("/admin/schedule", req.url), { status: 303 });
}
```

- [ ] **Step 9: 指派讲者 API `src/app/api/admin/sessions/[id]/speakers/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { sessionSpeakerSchema } from "@/lib/validation";
import { addSessionSpeaker } from "@/lib/schedule-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/sessions/[id]/speakers">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const parsed = sessionSpeakerSchema.safeParse({
    speakerId: form?.get("speakerId") ?? "",
    role: form?.get("role") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await addSessionSpeaker(id, parsed.data.speakerId, parsed.data.role);
  } catch (e) {
    if (e instanceof Error && e.message === "DUPLICATE_LINK") {
      return NextResponse.json({ ok: false, error: "该讲者已在此场次担任该角色" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "指派失败" }, { status: 400 });
  }
  return NextResponse.redirect(new URL(`/admin/schedule/${id}`, req.url), { status: 303 });
}
```

- [ ] **Step 10: 撤销讲者 API `src/app/api/admin/sessions/[id]/speakers/delete/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { sessionSpeakerSchema } from "@/lib/validation";
import { removeSessionSpeaker } from "@/lib/schedule-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/sessions/[id]/speakers/delete">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const parsed = sessionSpeakerSchema.safeParse({
    speakerId: form?.get("speakerId") ?? "",
    role: form?.get("role") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });
  }
  try {
    await removeSessionSpeaker(id, parsed.data.speakerId, parsed.data.role);
  } catch {
    return NextResponse.json({ ok: false, error: "撤销失败" }, { status: 400 });
  }
  return NextResponse.redirect(new URL(`/admin/schedule/${id}`, req.url), { status: 303 });
}
```

- [ ] **Step 11: 日程列表+新建页 `src/app/(admin)/admin/schedule/page.tsx`**

```tsx
import Link from "next/link";
import { listSessionsAdmin } from "@/lib/schedule-admin";

export default async function AdminSchedulePage() {
  const sessions = await listSessionsAdmin();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">日程管理</h1>

      <form action="/api/admin/sessions" method="post" className="grid grid-cols-2 gap-2 rounded border p-4 sm:grid-cols-3">
        <input name="day" type="date" required className="rounded border px-2 py-1.5 text-sm" />
        <input name="startTime" placeholder="开始 09:00" required className="rounded border px-2 py-1.5 text-sm" />
        <input name="endTime" placeholder="结束 10:00" required className="rounded border px-2 py-1.5 text-sm" />
        <input name="room" placeholder="会场" className="rounded border px-2 py-1.5 text-sm" />
        <input name="title" placeholder="场次标题" required className="rounded border px-2 py-1.5 text-sm sm:col-span-2" />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" name="isBrief" /> 进简明日程
        </label>
        <button type="submit" className="rounded bg-sky-700 px-3 py-1.5 text-sm text-white">新建场次</button>
      </form>

      {sessions.length === 0 ? (
        <p className="text-gray-500">暂无场次。</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">日期</th><th>时间</th><th>会场</th><th>标题</th><th>讲者</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="py-2">{s.day}</td>
                <td>{s.startTime}–{s.endTime}</td>
                <td>{s.room}</td>
                <td>{s.title}</td>
                <td>{s.speakers.map((x) => x.speaker.name).join("、")}</td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <Link href={`/admin/schedule/${s.id}`} className="text-sky-700 hover:underline">编辑</Link>
                    <form action={`/api/admin/sessions/${s.id}/delete`} method="post">
                      <button type="submit" className="text-red-600 hover:underline">删除</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 12: 场次编辑页(含讲者指派)`src/app/(admin)/admin/schedule/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getSessionAdmin } from "@/lib/schedule-admin";
import { getAllSpeakers } from "@/lib/speakers";

const ROLE_LABEL: Record<string, string> = { SPEAKER: "讲者", MODERATOR: "主持人" };

export default async function EditSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [sess, speakers] = await Promise.all([getSessionAdmin(id), getAllSpeakers()]);
  if (!sess) notFound();
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">编辑场次</h1>

      <form action={`/api/admin/sessions/${sess.id}`} method="post" className="space-y-3 rounded border p-4">
        <input name="day" type="date" required defaultValue={sess.day} className="w-full rounded border px-3 py-2" />
        <div className="flex gap-2">
          <input name="startTime" required defaultValue={sess.startTime} placeholder="开始" className="w-full rounded border px-3 py-2" />
          <input name="endTime" required defaultValue={sess.endTime} placeholder="结束" className="w-full rounded border px-3 py-2" />
        </div>
        <input name="room" defaultValue={sess.room} placeholder="会场" className="w-full rounded border px-3 py-2" />
        <input name="title" required defaultValue={sess.title} placeholder="标题" className="w-full rounded border px-3 py-2" />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" name="isBrief" defaultChecked={sess.isBrief} /> 进简明日程
        </label>
        <button type="submit" className="rounded bg-sky-700 px-4 py-2 text-white">保存场次</button>
      </form>

      <div className="space-y-3 rounded border p-4">
        <h2 className="font-medium">讲者 / 主持人</h2>
        {sess.speakers.length === 0 ? (
          <p className="text-sm text-gray-500">尚未指派。</p>
        ) : (
          <ul className="divide-y">
            {sess.speakers.map((x) => (
              <li key={`${x.speakerId}-${x.role}`} className="flex items-center gap-3 py-2 text-sm">
                <span>{x.speaker.name}</span>
                <span className="text-gray-400">{ROLE_LABEL[x.role] ?? x.role}</span>
                <form action={`/api/admin/sessions/${sess.id}/speakers/delete`} method="post" className="ml-auto">
                  <input type="hidden" name="speakerId" value={x.speakerId} />
                  <input type="hidden" name="role" value={x.role} />
                  <button type="submit" className="text-red-600 hover:underline">撤销</button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={`/api/admin/sessions/${sess.id}/speakers`} method="post" className="flex flex-wrap items-center gap-2">
          <select name="speakerId" required className="rounded border px-2 py-1.5 text-sm">
            <option value="">选择讲者</option>
            {speakers.map((sp) => (
              <option key={sp.id} value={sp.id}>{sp.name}</option>
            ))}
          </select>
          <select name="role" className="rounded border px-2 py-1.5 text-sm">
            <option value="SPEAKER">讲者</option>
            <option value="MODERATOR">主持人</option>
          </select>
          <button type="submit" className="rounded bg-green-600 px-3 py-1.5 text-sm text-white">指派</button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 13: 构建 + 全量测试**

Run: `npm run build && npm test`
Expected: 构建成功,`/admin/schedule`、`/admin/schedule/[id]`、五个 `/api/admin/sessions/...` 出现;测试全 PASS(新增 schedule-admin 1)。

- [ ] **Step 14: 提交**

```bash
git add src/lib/validation.ts src/lib/schedule-admin.ts src/app/api/admin/sessions \
  "src/app/(admin)/admin/schedule" tests/schedule-admin.test.ts
git commit -m "feat: 后台日程管理与讲者指派

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review(计划编写者自检结果)

- **Spec 覆盖**:对应 spec 第 5 节后台「讲者管理」「日程管理(场次增删改查 + 指派讲者/主持人)」。✅ 酒店 CRUD/用户管理/CSV 导出留 5·丙。
- **占位符扫描**:无 TBD/TODO;每步含完整代码。✅
- **类型/签名一致**:`speakerSchema`/`sessionSchema`/`sessionSpeakerSchema` 在 validation 定义、各 API 复用;`SessionWithSpeakers` 复用自 `@/lib/schedule`;复合主键定位 `sessionId_speakerId_role` 与 schema `@@id([sessionId, speakerId, role])` 对应;`addSessionSpeaker` 的 `DUPLICATE_LINK` 在领域、测试、API 三处一致。✅
- **安全**:所有新 `/api/admin/*`(8 个 handler)第一条即 `isAdmin` 守卫(403)。✅
- **外键**:删讲者/场次经 `SessionSpeaker` Cascade 自动清理关联,测试清理只删父行。✅
- **已知取舍**:(1) 时间用纯文本 `HH:MM`,不做格式强校验(YAGNI);(2) bio/简介用 `<textarea>` 直接编辑 HTML(无富文本编辑器);(3) 指派同一讲者同一角色重复时返回友好 400;不同角色(讲者+主持人)允许并存(复合主键含 role)。
