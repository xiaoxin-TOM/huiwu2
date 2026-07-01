# 阶段五·丙:酒店管理 + 用户管理 + CSV 导出 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 第五期(后台完善)收尾批:管理员可增删改查酒店、管理用户角色(含自我降级保护)、导出报名/投稿为 CSV;并补一项 HTTP 级 `/api/admin/*` 越权(403)守卫回归测试,锁住前几期一直延后的安全不变量。

**Architecture:** 沿用既有范式。写经 Route Handler,**每个 `/api/admin/*` handler 第一条即 `isAdmin` 守卫(403)**;原生 HTML 表单 + `303` 重定向。CSV 导出用 `GET` Route Handler 返回 `text/csv`(同样自带 isAdmin 守卫,因 `/api/admin/*` 不在 middleware matcher 内)。CSV 拼装抽成纯函数 `toCsv` 做 TDD。

**Tech Stack:** Next.js 16、Prisma 7、Auth.js v5、zod、Tailwind、Vitest(含 `vi.mock`)。

## Global Constraints

- 单会议系统;全部中文 UI 文案。
- **`/api/admin/*`(POST 与 GET 导出)必须在 handler 内 `isAdmin(session?.user?.role)` 守卫(403)作为第一条语句**;middleware 只覆盖 `/admin/:path*` 页面,不含 `/api/admin/*`。
- 写经 Route Handler;zod 校验;统一 `{ ok:false, error }`;DB 写包 try/catch;成功对原生表单 `303` 重定向回对应后台列表。
- Next.js 16:动态路由 `params`、`RouteContext<'…'>.params` 为 Promise,必须 `await`;写 Next 代码前读 `node_modules/next/dist/docs/`。
- 读用 Server Component + `prisma`/领域函数。
- 测试用独立测试库(`.env.test`→test.db),自建并清理。外键:`HotelBooking.hotel` 为 `Restrict`(有预订的酒店删除会失败,需捕获并友好提示)。
- 提交信息中文,结尾 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`。
- 禁止提交 `.env`、`.env.test`、`*.db`、`public/uploads/*`、`.superpowers/`。
- 复用:`src/lib/hotels.ts`(`listHotels` price 升序、`getHotel`)不改,新增 `hotels-admin.ts`;`src/lib/registrations.ts`(`listRegistrations`)、`src/lib/submissions.ts`(`listSubmissions`)不改;`isAdmin`、`auth`;`(admin)` 布局 MENU 已含 `/admin/hotels`、`/admin/users`。
- Vitest 别名 `@` → `src`,故可 `import { GET } from "@/app/api/admin/registrations/export/route"` 直接测路由 handler;`vi.mock("@/lib/auth", …)` 可替换 `auth()`。

## File Structure

- `src/lib/validation.ts` — 修改。新增 `hotelSchema`、`roleSchema`。
- `src/lib/hotels-admin.ts` — 创建。`createHotel`/`updateHotel`/`deleteHotel`。
- `src/lib/users-admin.ts` — 创建。`listUsers`/`setUserRole`。
- `src/lib/csv.ts` — 创建。`toCsv`(纯函数)。
- `src/app/api/admin/hotels/route.ts`、`.../hotels/[id]/route.ts`、`.../hotels/[id]/delete/route.ts` — 创建。
- `src/app/(admin)/admin/hotels/page.tsx`、`.../hotels/[id]/page.tsx` — 创建。
- `src/app/api/admin/users/[id]/role/route.ts` — 创建。
- `src/app/(admin)/admin/users/page.tsx` — 创建。
- `src/app/api/admin/registrations/export/route.ts`、`src/app/api/admin/submissions/export/route.ts` — 创建。
- `src/app/(admin)/admin/registrations/page.tsx`、`src/app/(admin)/admin/submissions/page.tsx` — 修改。加导出链接。
- `tests/hotels-admin.test.ts`、`tests/csv.test.ts`、`tests/admin-guard.test.ts` — 创建。

---

### Task 1: 酒店管理(/admin/hotels CRUD)

**Files:**
- Modify: `src/lib/validation.ts`
- Create: `src/lib/hotels-admin.ts`
- Create: `src/app/api/admin/hotels/route.ts`、`src/app/api/admin/hotels/[id]/route.ts`、`src/app/api/admin/hotels/[id]/delete/route.ts`
- Create: `src/app/(admin)/admin/hotels/page.tsx`、`src/app/(admin)/admin/hotels/[id]/page.tsx`
- Create: `tests/hotels-admin.test.ts`

**Interfaces:**
- Produces:
  - `hotelSchema`(`name` 必填;`price` 用 `z.coerce.number().int().min(0)`;`description`/`address`/`imageUrl`/`distance` 可选默认 "")。
  - `createHotel(data)`、`updateHotel(id, data)`、`deleteHotel(id)`(`data` 为 `{ name, description, price, address, imageUrl, distance }`)。
- Consumes: `listHotels`、`getHotel`(`@/lib/hotels`)。

- [ ] **Step 1: 为酒店后台领域函数写失败测试**

创建 `tests/hotels-admin.test.ts`:

```ts
import { afterAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import { getHotel } from "@/lib/hotels";
import { createHotel, updateHotel, deleteHotel } from "@/lib/hotels-admin";

const ids: string[] = [];

afterAll(async () => {
  await prisma.hotel.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

test("建→改→删 酒店", async () => {
  const h = await createHotel({
    name: "测试酒店", description: "<p>不错</p>", price: 500,
    address: "会场旁", imageUrl: "", distance: "步行 5 分钟",
  });
  ids.push(h.id);
  expect(h.name).toBe("测试酒店");
  expect(h.price).toBe(500);

  const up = await updateHotel(h.id, {
    name: "测试酒店", description: "<p>很好</p>", price: 666,
    address: "会场旁", imageUrl: "", distance: "步行 5 分钟",
  });
  expect(up.price).toBe(666);

  await deleteHotel(h.id);
  expect(await getHotel(h.id)).toBeNull();
});
```

- [ ] **Step 2: 运行测试,确认失败**

Run: `npm test -- tests/hotels-admin.test.ts`
Expected: FAIL,无法解析 `@/lib/hotels-admin`。

- [ ] **Step 3: 追加 `hotelSchema` 到 `src/lib/validation.ts`**

```ts
export const hotelSchema = z.object({
  name: z.string().min(1, "请填写酒店名称"),
  description: z.string().optional().default(""),
  price: z.coerce.number().int().min(0, "价格不能为负"),
  address: z.string().optional().default(""),
  imageUrl: z.string().optional().default(""),
  distance: z.string().optional().default(""),
});
```

- [ ] **Step 4: 实现 `src/lib/hotels-admin.ts`**

```ts
import { prisma } from "@/lib/prisma";

type HotelData = {
  name: string;
  description: string;
  price: number;
  address: string;
  imageUrl: string;
  distance: string;
};

export function createHotel(data: HotelData) {
  return prisma.hotel.create({ data });
}

export function updateHotel(id: string, data: HotelData) {
  return prisma.hotel.update({ where: { id }, data });
}

export function deleteHotel(id: string) {
  return prisma.hotel.delete({ where: { id } });
}
```

- [ ] **Step 5: 运行测试,确认通过**

Run: `npm test -- tests/hotels-admin.test.ts`
Expected: PASS。

- [ ] **Step 6: 新建酒店 API `src/app/api/admin/hotels/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { hotelSchema } from "@/lib/validation";
import { createHotel } from "@/lib/hotels-admin";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const form = await req.formData().catch(() => null);
  const parsed = hotelSchema.safeParse({
    name: form?.get("name") ?? "",
    description: form?.get("description") ?? "",
    price: form?.get("price") ?? "0",
    address: form?.get("address") ?? "",
    imageUrl: form?.get("imageUrl") ?? "",
    distance: form?.get("distance") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await createHotel(parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "创建失败" }, { status: 500 });
  }
  return NextResponse.redirect(new URL("/admin/hotels", req.url), { status: 303 });
}
```

- [ ] **Step 7: 更新酒店 API `src/app/api/admin/hotels/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { hotelSchema } from "@/lib/validation";
import { updateHotel } from "@/lib/hotels-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/hotels/[id]">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const parsed = hotelSchema.safeParse({
    name: form?.get("name") ?? "",
    description: form?.get("description") ?? "",
    price: form?.get("price") ?? "0",
    address: form?.get("address") ?? "",
    imageUrl: form?.get("imageUrl") ?? "",
    distance: form?.get("distance") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await updateHotel(id, parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "更新失败" }, { status: 400 });
  }
  return NextResponse.redirect(new URL("/admin/hotels", req.url), { status: 303 });
}
```

- [ ] **Step 8: 删除酒店 API `src/app/api/admin/hotels/[id]/delete/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { deleteHotel } from "@/lib/hotels-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/hotels/[id]/delete">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    await deleteHotel(id);
  } catch {
    // HotelBooking.hotel 为 Restrict:有预订时删除失败
    return NextResponse.json({ ok: false, error: "该酒店存在预订,无法删除" }, { status: 400 });
  }
  return NextResponse.redirect(new URL("/admin/hotels", req.url), { status: 303 });
}
```

- [ ] **Step 9: 酒店列表+新建页 `src/app/(admin)/admin/hotels/page.tsx`**

```tsx
import Link from "next/link";
import { listHotels } from "@/lib/hotels";

export default async function AdminHotelsPage() {
  const hotels = await listHotels();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">酒店管理</h1>

      <form action="/api/admin/hotels" method="post" className="grid grid-cols-2 gap-2 rounded border p-4">
        <input name="name" required placeholder="名称" className="rounded border px-3 py-2" />
        <input name="price" type="number" min={0} defaultValue={0} placeholder="价格/晚" className="rounded border px-3 py-2" />
        <input name="address" placeholder="地址" className="rounded border px-3 py-2" />
        <input name="distance" placeholder="距离" className="rounded border px-3 py-2" />
        <input name="imageUrl" placeholder="图片地址(可选)" className="col-span-2 rounded border px-3 py-2" />
        <textarea name="description" rows={2} placeholder="简介(HTML)" className="col-span-2 rounded border px-3 py-2 font-mono text-sm" />
        <button type="submit" className="rounded bg-sky-700 px-4 py-2 text-sm text-white">新建酒店</button>
      </form>

      {hotels.length === 0 ? (
        <p className="text-gray-500">暂无酒店。</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">名称</th><th>价格</th><th>地址</th><th>距离</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {hotels.map((h) => (
              <tr key={h.id} className="border-b">
                <td className="py-2">{h.name}</td>
                <td>¥{h.price}</td>
                <td>{h.address}</td>
                <td>{h.distance}</td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <Link href={`/admin/hotels/${h.id}`} className="text-sky-700 hover:underline">编辑</Link>
                    <form action={`/api/admin/hotels/${h.id}/delete`} method="post">
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

- [ ] **Step 10: 酒店编辑页 `src/app/(admin)/admin/hotels/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getHotel } from "@/lib/hotels";

export default async function EditHotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const h = await getHotel(id);
  if (!h) notFound();
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">编辑酒店</h1>
      <form action={`/api/admin/hotels/${h.id}`} method="post" className="space-y-3">
        <input name="name" required defaultValue={h.name} className="w-full rounded border px-3 py-2" />
        <input name="price" type="number" min={0} defaultValue={h.price} className="w-full rounded border px-3 py-2" />
        <input name="address" defaultValue={h.address} placeholder="地址" className="w-full rounded border px-3 py-2" />
        <input name="distance" defaultValue={h.distance} placeholder="距离" className="w-full rounded border px-3 py-2" />
        <input name="imageUrl" defaultValue={h.imageUrl ?? ""} placeholder="图片地址" className="w-full rounded border px-3 py-2" />
        <textarea name="description" rows={4} defaultValue={h.description} className="w-full rounded border px-3 py-2 font-mono text-sm" />
        <button type="submit" className="rounded bg-sky-700 px-4 py-2 text-white">保存</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 11: 构建 + 全量测试**

Run: `npm run build && npm test`
Expected: 构建成功,`/admin/hotels`、`/admin/hotels/[id]`、三个 `/api/admin/hotels/...` 出现;测试全 PASS(新增 hotels-admin 1)。

- [ ] **Step 12: 提交**

```bash
git add src/lib/validation.ts src/lib/hotels-admin.ts src/app/api/admin/hotels \
  "src/app/(admin)/admin/hotels" tests/hotels-admin.test.ts
git commit -m "feat: 后台酒店管理(增删改查)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: 用户管理(/admin/users 角色)

**Files:**
- Modify: `src/lib/validation.ts`
- Create: `src/lib/users-admin.ts`
- Create: `src/app/api/admin/users/[id]/role/route.ts`
- Create: `src/app/(admin)/admin/users/page.tsx`

**Interfaces:**
- Produces:
  - `roleSchema`(`role` 枚举 `USER|ADMIN`)。
  - `listUsers(): Promise<User[]>`(createdAt 升序)、`setUserRole(id, role: "USER"|"ADMIN"): Promise<User>`。

- [ ] **Step 1: 追加 `roleSchema` 到 `src/lib/validation.ts`**

```ts
export const roleSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});
```

- [ ] **Step 2: 实现 `src/lib/users-admin.ts`**

```ts
import { prisma } from "@/lib/prisma";

export function listUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: "asc" } });
}

export function setUserRole(id: string, role: "USER" | "ADMIN") {
  return prisma.user.update({ where: { id }, data: { role } });
}
```

- [ ] **Step 3: 创建改角色 API `src/app/api/admin/users/[id]/role/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { roleSchema } from "@/lib/validation";
import { setUserRole } from "@/lib/users-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/users/[id]/role">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  // 防自锁:不允许修改自己的角色
  if (id === session?.user?.id) {
    return NextResponse.json({ ok: false, error: "不能修改自己的角色" }, { status: 400 });
  }
  const form = await req.formData().catch(() => null);
  const parsed = roleSchema.safeParse({ role: form?.get("role") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });
  }
  try {
    await setUserRole(id, parsed.data.role);
  } catch {
    return NextResponse.json({ ok: false, error: "操作失败" }, { status: 400 });
  }
  return NextResponse.redirect(new URL("/admin/users", req.url), { status: 303 });
}
```

- [ ] **Step 4: 创建用户管理页 `src/app/(admin)/admin/users/page.tsx`**

```tsx
import { auth } from "@/lib/auth";
import { listUsers } from "@/lib/users-admin";

export default async function AdminUsersPage() {
  const [session, users] = await Promise.all([auth(), listUsers()]);
  const selfId = session?.user?.id;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">用户管理</h1>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2">姓名</th><th>邮箱</th><th>角色</th><th>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b">
              <td className="py-2">{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role === "ADMIN" ? "管理员" : "用户"}</td>
              <td className="py-2">
                {u.id === selfId ? (
                  <span className="text-gray-400">当前账号</span>
                ) : (
                  <form action={`/api/admin/users/${u.id}/role`} method="post" className="flex items-center gap-2">
                    <select name="role" defaultValue={u.role} className="rounded border px-2 py-1 text-sm">
                      <option value="USER">用户</option>
                      <option value="ADMIN">管理员</option>
                    </select>
                    <button type="submit" className="rounded bg-sky-700 px-2 py-1 text-xs text-white">设为</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: 构建 + 测试**

Run: `npm run build && npm test`
Expected: 构建成功,`/admin/users`、`/api/admin/users/[id]/role` 出现;测试全 PASS。

- [ ] **Step 6: 提交**

```bash
git add src/lib/validation.ts src/lib/users-admin.ts src/app/api/admin/users \
  "src/app/(admin)/admin/users"
git commit -m "feat: 后台用户角色管理(含自我降级保护)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: CSV 导出 + 越权守卫测试

**Files:**
- Create: `src/lib/csv.ts`
- Create: `src/app/api/admin/registrations/export/route.ts`、`src/app/api/admin/submissions/export/route.ts`
- Modify: `src/app/(admin)/admin/registrations/page.tsx`、`src/app/(admin)/admin/submissions/page.tsx`
- Create: `tests/csv.test.ts`、`tests/admin-guard.test.ts`

**Interfaces:**
- Produces:
  - `toCsv(headers: string[], rows: (string | number)[][]): string` — 纯函数,CRLF 连接;含 `,` `"` 换行的字段加引号并转义双引号。

- [ ] **Step 1: 为 `toCsv` 写失败测试**

创建 `tests/csv.test.ts`:

```ts
import { expect, test } from "vitest";
import { toCsv } from "@/lib/csv";

test("基本拼装,CRLF 分隔", () => {
  const csv = toCsv(["a", "b"], [["1", "2"], ["3", "4"]]);
  expect(csv).toBe("a,b\r\n1,2\r\n3,4");
});

test("含逗号/引号/换行的字段被正确转义", () => {
  const csv = toCsv(["x"], [['含,逗号'], ['含"引号'], ["含\n换行"]]);
  expect(csv).toBe('x\r\n"含,逗号"\r\n"含""引号"\r\n"含\n换行"');
});

test("数字字段可用", () => {
  expect(toCsv(["n"], [[5]])).toBe("n\r\n5");
});
```

- [ ] **Step 2: 运行测试,确认失败**

Run: `npm test -- tests/csv.test.ts`
Expected: FAIL,无法解析 `@/lib/csv`。

- [ ] **Step 3: 实现 `src/lib/csv.ts`**

```ts
function escapeField(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeField).join(",")).join("\r\n");
}
```

- [ ] **Step 4: 运行测试,确认通过**

Run: `npm test -- tests/csv.test.ts`
Expected: PASS(3 passing)。

- [ ] **Step 5: 报名导出 API `src/app/api/admin/registrations/export/route.ts`**

```ts
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { listRegistrations } from "@/lib/registrations";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return new Response(JSON.stringify({ ok: false, error: "无权限" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const regs = await listRegistrations();
  const csv = toCsv(
    ["姓名", "邮箱", "参会类型", "单位", "职称", "电话", "状态", "提交时间"],
    regs.map((r) => [
      r.fullName, r.user.email, r.type.name, r.organization, r.title, r.phone, r.status,
      r.createdAt.toISOString(),
    ]),
  );
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="registrations.csv"',
    },
  });
}
```

(说明:开头 `﻿` 为 BOM,确保 Excel 正确识别 UTF-8 中文。)

- [ ] **Step 6: 投稿导出 API `src/app/api/admin/submissions/export/route.ts`**

```ts
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { listSubmissions } from "@/lib/submissions";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return new Response(JSON.stringify({ ok: false, error: "无权限" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const subs = await listSubmissions();
  const csv = toCsv(
    ["题目", "作者", "提交人邮箱", "文件", "状态", "提交时间"],
    subs.map((s) => [
      s.title, s.authors, s.user.email, s.fileUrl ?? "", s.status, s.createdAt.toISOString(),
    ]),
  );
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="submissions.csv"',
    },
  });
}
```

- [ ] **Step 7: 列表页加导出链接**

在 `src/app/(admin)/admin/registrations/page.tsx` 的 `<h1>报名管理</h1>` 同一行右侧加导出链接。把标题那行改为:

```tsx
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">报名管理</h1>
        <a href="/api/admin/registrations/export" className="text-sm text-sky-700 hover:underline">导出 CSV</a>
      </div>
```

在 `src/app/(admin)/admin/submissions/page.tsx` 同样把 `<h1>论文管理</h1>` 那行改为:

```tsx
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">论文管理</h1>
        <a href="/api/admin/submissions/export" className="text-sm text-sky-700 hover:underline">导出 CSV</a>
      </div>
```

(其余表格内容不变;注意外层若已是 `<div className="space-y-4">` 则把新 `<div>` 放在原 `<h1>` 位置。)

- [ ] **Step 8: 越权守卫回归测试 `tests/admin-guard.test.ts`**

创建 `tests/admin-guard.test.ts`(用 `vi.mock` 替换 `auth`,验证非管理员/未登录导出被 403 拒绝):

```ts
import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/lib/auth";
import { GET as exportRegistrations } from "@/app/api/admin/registrations/export/route";

const mockedAuth = vi.mocked(auth);

beforeEach(() => mockedAuth.mockReset());
afterEach(() => vi.restoreAllMocks());

test("未登录导出报名返回 403", async () => {
  mockedAuth.mockResolvedValue(null as never);
  const res = await exportRegistrations();
  expect(res.status).toBe(403);
});

test("普通用户导出报名返回 403", async () => {
  mockedAuth.mockResolvedValue({ user: { id: "u1", role: "USER" } } as never);
  const res = await exportRegistrations();
  expect(res.status).toBe(403);
});
```

(说明:`auth` 被 mock,返回非管理员时 handler 在第一条守卫即返回 403,不触达 prisma,故无需数据库。)

- [ ] **Step 9: 运行测试,确认通过**

Run: `npm test -- tests/admin-guard.test.ts`
Expected: PASS(2 passing)。

- [ ] **Step 10: 构建 + 全量测试**

Run: `npm run build && npm test`
Expected: 构建成功,`/api/admin/registrations/export`、`/api/admin/submissions/export` 出现;测试全 PASS(新增 csv 3 + admin-guard 2)。

- [ ] **Step 11: 提交**

```bash
git add src/lib/csv.ts src/app/api/admin/registrations/export src/app/api/admin/submissions/export \
  "src/app/(admin)/admin/registrations/page.tsx" "src/app/(admin)/admin/submissions/page.tsx" \
  tests/csv.test.ts tests/admin-guard.test.ts
git commit -m "feat: 报名/投稿 CSV 导出与越权守卫回归测试

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review(计划编写者自检结果)

- **Spec 覆盖**:对应 spec 第 5 节后台「酒店管理(增删改查 + 预订申请处理——审核已在第四期)」「用户管理(用户列表、角色管理)」「报名/论文管理导出 CSV」。至此后台十大板块全部具备。✅
- **占位符扫描**:无 TBD/TODO;每步含完整代码。✅
- **类型/签名一致**:`hotelSchema`/`roleSchema` 在 validation 定义、API 复用;`toCsv` 签名在测试、两个导出 handler 一致;`setUserRole` 角色用 `"USER"|"ADMIN"` 与 `roleSchema` 枚举一致。✅
- **安全**:所有新 `/api/admin/*`(POST 4 + GET 导出 2)第一条即 `isAdmin` 守卫(403);用户改角色额外加「不能改自己」防自锁;新增 `admin-guard.test.ts` 以 `vi.mock` 锁住导出 GET 的 403 不变量(回应历次整支评审建议)。✅
- **外键**:删酒店遇 `Restrict`(有预订)捕获并友好 400。✅
- **已知取舍**:(1) CSV 用自写 `toCsv`(无第三方库,YAGNI),已覆盖逗号/引号/换行转义与 BOM;(2) 越权回归测试只覆盖一个代表性导出 GET(其余 admin handler 守卫模式同构,且每任务评审已逐一核验),全量 HTTP 越权矩阵非本期目标;(3) 用户管理仅角色增改,不做删除用户(有外键关联,且 YAGNI)。
