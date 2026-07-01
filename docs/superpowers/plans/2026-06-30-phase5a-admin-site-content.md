# 阶段五·甲:收尾清理 + 站点设置 + 通知/内容管理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 第五期(后台完善)第一批:清理前四期累计的小项并补全仪表盘;让管理员能在后台维护会议基本信息(站点设置)、增删改查会议通知、编辑富文本内容页(会场交通/联系方式)。

**Architecture:** 沿用既有范式。后台页 `/admin/*` 由 middleware 守卫(ADMIN);写经 Route Handler,**`/api/admin/*` 不在 matcher 内,每个 handler 必须自带 `isAdmin` 守卫(403)**,用原生 HTML `<form method="post">` 提交后 `303` 重定向。读用 Server Component 直连领域函数/prisma。状态标签集中到 `src/lib/labels.ts`。

**Tech Stack:** Next.js 16、Prisma 7、Auth.js v5、zod、Tailwind、Vitest。

## Global Constraints

- 单会议系统;全部中文 UI 文案。
- **`/api/admin/*` 必须在 handler 内 `isAdmin(session?.user?.role)` 守卫(403)作为第一条语句**(middleware 只覆盖 `/admin/:path*` 页面)。
- 写经 Route Handler;zod 校验;统一 `{ ok:false, error }`;盘/库失败包 try/catch 返回该结构;成功对原生表单用 `303` 重定向回对应后台列表。
- Next.js 16:动态路由 `params`、`RouteContext<'…'>.params` 为 Promise,必须 `await`;写 Next 代码前读 `node_modules/next/dist/docs/`。
- 读用 Server Component + `prisma`/领域函数。
- 富文本字段仅管理员可写,前台经 `RichText` 渲染。
- 测试用独立测试库(`.env.test`→test.db),自建并清理。
- 提交信息中文,结尾 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`。
- 禁止提交 `.env`、`.env.test`、`*.db`、`public/uploads/*`、`.superpowers/`。
- 已存在:`SiteConfig`(单行 id=1:confName/confDate/confLocation/logoUrl/welcomeHtml/liveUrl/contactHtml)、`Page`(slug/title/contentHtml)、`Notice`(id/title/contentHtml/isPublished/publishedAt);`src/lib/content.ts`(`getPublishedNotices`/`getNoticeById`/`getPage`);`isAdmin`、`auth`;`(admin)` 布局 MENU 已含 `/admin/site`、`/admin/notices`(`/admin/pages` 需新增到菜单)。

## File Structure

- `src/lib/labels.ts` — 创建。导出 `STATUS_LABEL`。
- 多处页面 — 修改。改为从 `@/lib/labels` 导入 `STATUS_LABEL`(去重)。
- `src/app/(public)/me/page.tsx` — 修改。预订空态裸 `<a>` 改 `<Link>`;改用共享 STATUS_LABEL。
- `src/app/api/registrations/route.ts`、`src/app/api/bookings/route.ts` — 修改。null body 显式 400「参数错误」。
- `src/lib/upload.ts` — 修改。删除 `saveImage` 的 `?? "bin"` 死代码。
- `tests/upload-image.test.ts` — 修改。加 5MB 边界断言。
- `src/app/(admin)/admin/page.tsx` — 修改。仪表盘加预订/相册计数。
- `src/lib/siteconfig.ts` — 创建。`getSiteConfig`/`updateSiteConfig`。
- `src/lib/validation.ts` — 修改。新增 `siteConfigSchema`、`noticeSchema`、`pageSchema`。
- `src/app/api/admin/site/route.ts` — 创建。
- `src/app/(admin)/admin/site/page.tsx` — 创建。
- `src/lib/notices-admin.ts` — 创建。`listAllNotices`/`createNotice`/`updateNotice`/`deleteNotice`/`getNotice`。
- `src/app/api/admin/notices/route.ts`、`.../notices/[id]/route.ts`、`.../notices/[id]/delete/route.ts` — 创建。
- `src/app/(admin)/admin/notices/page.tsx`、`.../notices/[id]/page.tsx` — 创建。
- `src/lib/pages-admin.ts` — 创建。`listPages`/`upsertPage`。
- `src/app/api/admin/pages/[slug]/route.ts` — 创建。
- `src/app/(admin)/admin/pages/page.tsx` — 创建。
- `src/app/(admin)/admin/layout.tsx` — 修改。MENU 增加 `/admin/pages`。
- `tests/notices-admin.test.ts`、`tests/validation-admin.test.ts` — 创建。

---

### Task 1: 收尾清理 + 仪表盘补全

**Files:**
- Create: `src/lib/labels.ts`
- Modify: `src/app/(public)/me/page.tsx`、`src/app/(public)/register-conf/page.tsx`、`src/app/(public)/submissions/page.tsx`、`src/app/(admin)/admin/registrations/page.tsx`、`src/app/(admin)/admin/submissions/page.tsx`、`src/app/(admin)/admin/bookings/page.tsx`
- Modify: `src/app/api/registrations/route.ts`、`src/app/api/bookings/route.ts`
- Modify: `src/lib/upload.ts`、`tests/upload-image.test.ts`
- Modify: `src/app/(admin)/admin/page.tsx`

**Interfaces:**
- Produces: `STATUS_LABEL: Record<string,string>`(`PENDING/APPROVED/REJECTED → 待审核/已通过/未通过`)。

- [ ] **Step 1: 创建 `src/lib/labels.ts`**

```ts
/** 报名/投稿/预订共用的中文状态标签。 */
export const STATUS_LABEL: Record<string, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "未通过",
};
```

- [ ] **Step 2: 六处改为导入共享 STATUS_LABEL**

在以下文件中,删除各自顶部的 `const STATUS_LABEL = {…}` 定义,改为 `import { STATUS_LABEL } from "@/lib/labels";`(注意保持其余 import 不变):
`src/app/(public)/me/page.tsx`、`src/app/(public)/register-conf/page.tsx`、`src/app/(public)/submissions/page.tsx`、`src/app/(admin)/admin/registrations/page.tsx`、`src/app/(admin)/admin/submissions/page.tsx`、`src/app/(admin)/admin/bookings/page.tsx`。

- [ ] **Step 3: `/me` 预订空态裸 `<a>` 改 `<Link>`**

在 `src/app/(public)/me/page.tsx` 中,把:

```tsx
            尚无预订。<a href="/hotels" className="text-sky-700 hover:underline">去预订</a>
```

改为:

```tsx
            尚无预订。<Link href="/hotels" className="text-sky-700 hover:underline">去预订</Link>
```

(`Link` 已在该文件导入。)

- [ ] **Step 4: 两个 JSON 接口对 null body 显式 400**

在 `src/app/api/registrations/route.ts` 与 `src/app/api/bookings/route.ts` 中,把:

```ts
  const body = await req.json().catch(() => null);
  const parsed = <schema>.safeParse(body);
```

改为在 `safeParse` 前加一行守卫:

```ts
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });
  const parsed = <schema>.safeParse(body);
```

(`<schema>` 分别是 `registrationSchema` / `bookingSchema`,保持原样。)

- [ ] **Step 5: 删除 `saveImage` 死代码并补边界测试**

在 `src/lib/upload.ts` 的 `saveImage` 中,把:

```ts
  const ext = IMAGE_EXT[file.type] ?? "bin";
```

改为(`saveImage` 只在 `validateImage` 通过后调用,`file.type` 必在表内):

```ts
  const ext = IMAGE_EXT[file.type];
```

在 `tests/upload-image.test.ts` 追加边界用例:

```ts
test("正好 5MB 通过", () => {
  expect(validateImage({ type: "image/jpeg", size: 5 * 1024 * 1024 })).toBeNull();
});
```

- [ ] **Step 6: 仪表盘补全预订/相册计数**

把 `src/app/(admin)/admin/page.tsx` 改为:

```tsx
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [users, regs, subs, bookings, albums] = await Promise.all([
    prisma.user.count(),
    prisma.registration.count(),
    prisma.submission.count(),
    prisma.hotelBooking.count(),
    prisma.album.count(),
  ]);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">仪表盘</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          ["用户", users],
          ["报名", regs],
          ["投稿", subs],
          ["预订", bookings],
          ["相册", albums],
        ].map(([label, n]) => (
          <div key={label as string} className="rounded border bg-white p-4">
            <div className="text-sm text-gray-500">{label}</div>
            <div className="text-2xl font-bold">{n as number}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: 运行测试与构建**

Run: `npm test -- tests/upload-image.test.ts` (Expected: PASS,含新 5MB 边界用例)
Run: `npm run build && npm test`
Expected: 构建成功,无类型错误;全部测试 PASS(46 + 1 新边界 = 47),输出干净。

- [ ] **Step 8: 提交**

```bash
git add src/lib/labels.ts "src/app/(public)/me/page.tsx" "src/app/(public)/register-conf/page.tsx" \
  "src/app/(public)/submissions/page.tsx" "src/app/(admin)/admin/registrations/page.tsx" \
  "src/app/(admin)/admin/submissions/page.tsx" "src/app/(admin)/admin/bookings/page.tsx" \
  src/app/api/registrations/route.ts src/app/api/bookings/route.ts \
  src/lib/upload.ts tests/upload-image.test.ts "src/app/(admin)/admin/page.tsx"
git commit -m "refactor: 状态标签集中、接口空体守卫、仪表盘补全等收尾清理

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: 站点设置(/admin/site)

**Files:**
- Create: `src/lib/siteconfig.ts`
- Modify: `src/lib/validation.ts`
- Create: `src/app/api/admin/site/route.ts`
- Create: `src/app/(admin)/admin/site/page.tsx`
- Create: `tests/validation-admin.test.ts`

**Interfaces:**
- Produces:
  - `siteConfigSchema`(`confName`/`confDate`/`confLocation` 必填 string;`logoUrl`/`liveUrl`/`welcomeHtml` 可选,默认 "")。
  - `getSiteConfig(): Promise<SiteConfig | null>`、`updateSiteConfig(data): Promise<SiteConfig>`(upsert id=1)。

- [ ] **Step 1: 为 siteConfigSchema 写失败测试**

创建 `tests/validation-admin.test.ts`:

```ts
import { expect, test } from "vitest";
import { siteConfigSchema } from "@/lib/validation";

test("站点设置:必填会议名,选填默认空串", () => {
  expect(siteConfigSchema.safeParse({ confName: "" }).success).toBe(false);
  const r = siteConfigSchema.safeParse({
    confName: "示例年会", confDate: "2026-09", confLocation: "北京",
  });
  expect(r.success).toBe(true);
  if (r.success) expect(r.data.liveUrl).toBe("");
});
```

- [ ] **Step 2: 运行测试,确认失败**

Run: `npm test -- tests/validation-admin.test.ts`
Expected: FAIL,无法解析 `siteConfigSchema`。

- [ ] **Step 3: 追加 `siteConfigSchema` 到 `src/lib/validation.ts`**

```ts
export const siteConfigSchema = z.object({
  confName: z.string().min(1, "请填写会议名称"),
  confDate: z.string().optional().default(""),
  confLocation: z.string().optional().default(""),
  logoUrl: z.string().optional().default(""),
  liveUrl: z.string().optional().default(""),
  welcomeHtml: z.string().optional().default(""),
});
```

- [ ] **Step 4: 运行测试,确认通过**

Run: `npm test -- tests/validation-admin.test.ts`
Expected: PASS。

- [ ] **Step 5: 实现 `src/lib/siteconfig.ts`**

```ts
import { prisma } from "@/lib/prisma";

export function getSiteConfig() {
  return prisma.siteConfig.findUnique({ where: { id: 1 } });
}

export function updateSiteConfig(data: {
  confName: string;
  confDate: string;
  confLocation: string;
  logoUrl: string;
  liveUrl: string;
  welcomeHtml: string;
}) {
  return prisma.siteConfig.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
}
```

- [ ] **Step 6: 创建站点设置 API `src/app/api/admin/site/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { siteConfigSchema } from "@/lib/validation";
import { updateSiteConfig } from "@/lib/siteconfig";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const form = await req.formData().catch(() => null);
  const parsed = siteConfigSchema.safeParse({
    confName: form?.get("confName"),
    confDate: form?.get("confDate"),
    confLocation: form?.get("confLocation"),
    logoUrl: form?.get("logoUrl"),
    liveUrl: form?.get("liveUrl"),
    welcomeHtml: form?.get("welcomeHtml"),
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await updateSiteConfig(parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "保存失败" }, { status: 500 });
  }
  return NextResponse.redirect(new URL("/admin/site", req.url), { status: 303 });
}
```

注意:`form?.get(...)` 对缺失字段返回 `null`,而 schema 的可选项用 `.optional().default("")` 仅在 `undefined` 时填默认;因此 API 里对可选项需把 `null` normalise 成 `undefined`。改用如下写法读取:

```ts
  const g = (k: string) => {
    const v = form?.get(k);
    return v == null ? undefined : String(v);
  };
  const parsed = siteConfigSchema.safeParse({
    confName: g("confName"),
    confDate: g("confDate"),
    confLocation: g("confLocation"),
    logoUrl: g("logoUrl"),
    liveUrl: g("liveUrl"),
    welcomeHtml: g("welcomeHtml"),
  });
```

(用此 `g` 版本替换上面的内联 `form?.get` 对象。)

- [ ] **Step 7: 创建站点设置页 `src/app/(admin)/admin/site/page.tsx`**

```tsx
import { getSiteConfig } from "@/lib/siteconfig";

export default async function AdminSitePage() {
  const cfg = await getSiteConfig();
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">站点设置</h1>
      <form action="/api/admin/site" method="post" className="space-y-3">
        <label className="block text-sm text-gray-600">会议名称
          <input name="confName" required defaultValue={cfg?.confName ?? ""}
            className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm text-gray-600">会议时间
          <input name="confDate" defaultValue={cfg?.confDate ?? ""}
            className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm text-gray-600">会议地点
          <input name="confLocation" defaultValue={cfg?.confLocation ?? ""}
            className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm text-gray-600">Logo 图片地址
          <input name="logoUrl" defaultValue={cfg?.logoUrl ?? ""}
            className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm text-gray-600">直播地址(外部链接)
          <input name="liveUrl" defaultValue={cfg?.liveUrl ?? ""}
            className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm text-gray-600">欢迎致辞(HTML)
          <textarea name="welcomeHtml" rows={6} defaultValue={cfg?.welcomeHtml ?? ""}
            className="mt-1 w-full rounded border px-3 py-2 font-mono text-sm" />
        </label>
        <button type="submit" className="rounded bg-sky-700 px-4 py-2 text-white">保存</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 8: 构建 + 测试**

Run: `npm run build && npm test`
Expected: 构建成功,`/admin/site`、`/api/admin/site` 出现;测试全 PASS。

- [ ] **Step 9: 提交**

```bash
git add src/lib/siteconfig.ts src/lib/validation.ts src/app/api/admin/site \
  "src/app/(admin)/admin/site" tests/validation-admin.test.ts
git commit -m "feat: 后台站点设置

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: 通知管理(/admin/notices CRUD)

**Files:**
- Create: `src/lib/notices-admin.ts`
- Modify: `src/lib/validation.ts`
- Create: `src/app/api/admin/notices/route.ts`、`src/app/api/admin/notices/[id]/route.ts`、`src/app/api/admin/notices/[id]/delete/route.ts`
- Create: `src/app/(admin)/admin/notices/page.tsx`、`src/app/(admin)/admin/notices/[id]/page.tsx`
- Create: `tests/notices-admin.test.ts`

**Interfaces:**
- Produces:
  - `noticeSchema`(`title` 必填;`contentHtml` 可选默认 "";`isPublished` 布尔,来自 checkbox)。
  - `listAllNotices(): Promise<Notice[]>`(publishedAt 降序,含未发布)。
  - `getNotice(id): Promise<Notice | null>`(不限发布状态;后台编辑用)。
  - `createNotice({title,contentHtml,isPublished}): Promise<Notice>`。
  - `updateNotice(id, {title,contentHtml,isPublished}): Promise<Notice>`。
  - `deleteNotice(id): Promise<Notice>`。

- [ ] **Step 1: 为后台通知领域函数写失败测试**

创建 `tests/notices-admin.test.ts`:

```ts
import { afterAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  listAllNotices,
  getNotice,
  createNotice,
  updateNotice,
  deleteNotice,
} from "@/lib/notices-admin";

const ids: string[] = [];

afterAll(async () => {
  await prisma.notice.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

test("建→改→读(含未发布)→删 通知", async () => {
  const n = await createNotice({ title: "草稿通知", contentHtml: "<p>x</p>", isPublished: false });
  ids.push(n.id);
  expect(n.isPublished).toBe(false);

  const all = await listAllNotices();
  expect(all.some((x) => x.id === n.id)).toBe(true); // 未发布也在后台列表

  const up = await updateNotice(n.id, { title: "正式通知", contentHtml: "<p>y</p>", isPublished: true });
  expect(up.title).toBe("正式通知");
  expect(up.isPublished).toBe(true);

  expect((await getNotice(n.id))?.title).toBe("正式通知");

  await deleteNotice(n.id);
  expect(await getNotice(n.id)).toBeNull();
});
```

- [ ] **Step 2: 运行测试,确认失败**

Run: `npm test -- tests/notices-admin.test.ts`
Expected: FAIL,无法解析 `@/lib/notices-admin`。

- [ ] **Step 3: 追加 `noticeSchema` 到 `src/lib/validation.ts`**

```ts
export const noticeSchema = z.object({
  title: z.string().min(1, "请填写标题"),
  contentHtml: z.string().optional().default(""),
  isPublished: z.boolean(),
});
```

- [ ] **Step 4: 实现 `src/lib/notices-admin.ts`**

```ts
import { prisma } from "@/lib/prisma";

export function listAllNotices() {
  return prisma.notice.findMany({ orderBy: { publishedAt: "desc" } });
}

export function getNotice(id: string) {
  return prisma.notice.findUnique({ where: { id } });
}

export function createNotice(data: { title: string; contentHtml: string; isPublished: boolean }) {
  return prisma.notice.create({ data });
}

export function updateNotice(
  id: string,
  data: { title: string; contentHtml: string; isPublished: boolean },
) {
  return prisma.notice.update({ where: { id }, data });
}

export function deleteNotice(id: string) {
  return prisma.notice.delete({ where: { id } });
}
```

- [ ] **Step 5: 运行测试,确认通过**

Run: `npm test -- tests/notices-admin.test.ts`
Expected: PASS。

- [ ] **Step 6: 创建 API —— 新建 `src/app/api/admin/notices/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { noticeSchema } from "@/lib/validation";
import { createNotice } from "@/lib/notices-admin";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const form = await req.formData().catch(() => null);
  const parsed = noticeSchema.safeParse({
    title: form?.get("title") ?? "",
    contentHtml: form?.get("contentHtml") ?? "",
    isPublished: form?.get("isPublished") === "on",
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await createNotice(parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "创建失败" }, { status: 500 });
  }
  return NextResponse.redirect(new URL("/admin/notices", req.url), { status: 303 });
}
```

- [ ] **Step 7: 创建 API —— 更新 `src/app/api/admin/notices/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { noticeSchema } from "@/lib/validation";
import { updateNotice } from "@/lib/notices-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/notices/[id]">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const parsed = noticeSchema.safeParse({
    title: form?.get("title") ?? "",
    contentHtml: form?.get("contentHtml") ?? "",
    isPublished: form?.get("isPublished") === "on",
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await updateNotice(id, parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "更新失败" }, { status: 400 });
  }
  return NextResponse.redirect(new URL("/admin/notices", req.url), { status: 303 });
}
```

- [ ] **Step 8: 创建 API —— 删除 `src/app/api/admin/notices/[id]/delete/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { deleteNotice } from "@/lib/notices-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/notices/[id]/delete">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    await deleteNotice(id);
  } catch {
    return NextResponse.json({ ok: false, error: "删除失败" }, { status: 400 });
  }
  return NextResponse.redirect(new URL("/admin/notices", req.url), { status: 303 });
}
```

- [ ] **Step 9: 创建通知列表+新建页 `src/app/(admin)/admin/notices/page.tsx`**

```tsx
import Link from "next/link";
import { listAllNotices } from "@/lib/notices-admin";

export default async function AdminNoticesPage() {
  const notices = await listAllNotices();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">通知管理</h1>

      <form action="/api/admin/notices" method="post" className="space-y-2 rounded border p-4">
        <h2 className="font-medium">新建通知</h2>
        <input name="title" required placeholder="标题" className="w-full rounded border px-3 py-2" />
        <textarea name="contentHtml" rows={4} placeholder="正文(HTML)"
          className="w-full rounded border px-3 py-2 font-mono text-sm" />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" name="isPublished" defaultChecked /> 立即发布
        </label>
        <button type="submit" className="rounded bg-sky-700 px-4 py-2 text-sm text-white">新建</button>
      </form>

      {notices.length === 0 ? (
        <p className="text-gray-500">暂无通知。</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">标题</th><th>状态</th><th>时间</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {notices.map((n) => (
              <tr key={n.id} className="border-b">
                <td className="py-2">{n.title}</td>
                <td>{n.isPublished ? "已发布" : "未发布"}</td>
                <td>{n.publishedAt.toISOString().slice(0, 10)}</td>
                <td className="flex gap-2 py-2">
                  <Link href={`/admin/notices/${n.id}`} className="text-sky-700 hover:underline">编辑</Link>
                  <form action={`/api/admin/notices/${n.id}/delete`} method="post">
                    <button type="submit" className="text-red-600 hover:underline">删除</button>
                  </form>
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

- [ ] **Step 10: 创建通知编辑页 `src/app/(admin)/admin/notices/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getNotice } from "@/lib/notices-admin";

export default async function EditNoticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notice = await getNotice(id);
  if (!notice) notFound();
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">编辑通知</h1>
      <form action={`/api/admin/notices/${notice.id}`} method="post" className="space-y-3">
        <input name="title" required defaultValue={notice.title}
          className="w-full rounded border px-3 py-2" />
        <textarea name="contentHtml" rows={8} defaultValue={notice.contentHtml}
          className="w-full rounded border px-3 py-2 font-mono text-sm" />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" name="isPublished" defaultChecked={notice.isPublished} /> 已发布
        </label>
        <button type="submit" className="rounded bg-sky-700 px-4 py-2 text-white">保存</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 11: 构建 + 全量测试**

Run: `npm run build && npm test`
Expected: 构建成功,`/admin/notices`、`/admin/notices/[id]`、三个 `/api/admin/notices/...` 出现;测试全 PASS(新增 notices-admin 1)。

- [ ] **Step 12: 提交**

```bash
git add src/lib/notices-admin.ts src/lib/validation.ts src/app/api/admin/notices \
  "src/app/(admin)/admin/notices" tests/notices-admin.test.ts
git commit -m "feat: 后台通知管理(增删改查)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: 内容页编辑(/admin/pages)

**Files:**
- Create: `src/lib/pages-admin.ts`
- Modify: `src/lib/validation.ts`
- Create: `src/app/api/admin/pages/[slug]/route.ts`
- Create: `src/app/(admin)/admin/pages/page.tsx`
- Modify: `src/app/(admin)/admin/layout.tsx`

**Interfaces:**
- Produces:
  - `pageSchema`(`title` 必填;`contentHtml` 可选默认 "")。
  - `listPages(): Promise<Page[]>`(按 slug 升序)、`upsertPage(slug, {title, contentHtml}): Promise<Page>`。

- [ ] **Step 1: 追加 `pageSchema` 到 `src/lib/validation.ts`**

```ts
export const pageSchema = z.object({
  title: z.string().min(1, "请填写标题"),
  contentHtml: z.string().optional().default(""),
});
```

- [ ] **Step 2: 实现 `src/lib/pages-admin.ts`**

```ts
import { prisma } from "@/lib/prisma";

export function listPages() {
  return prisma.page.findMany({ orderBy: { slug: "asc" } });
}

export function upsertPage(slug: string, data: { title: string; contentHtml: string }) {
  return prisma.page.upsert({
    where: { slug },
    update: data,
    create: { slug, ...data },
  });
}
```

- [ ] **Step 3: 创建内容页编辑 API `src/app/api/admin/pages/[slug]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { pageSchema } from "@/lib/validation";
import { upsertPage } from "@/lib/pages-admin";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/pages/[slug]">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { slug } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const parsed = pageSchema.safeParse({
    title: form?.get("title") ?? "",
    contentHtml: form?.get("contentHtml") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await upsertPage(slug, parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "保存失败" }, { status: 500 });
  }
  return NextResponse.redirect(new URL("/admin/pages", req.url), { status: 303 });
}
```

- [ ] **Step 4: 创建内容页管理页 `src/app/(admin)/admin/pages/page.tsx`**

```tsx
import { listPages } from "@/lib/pages-admin";

const KNOWN: { slug: string; label: string }[] = [
  { slug: "venue", label: "会场交通" },
  { slug: "contact", label: "联系方式" },
];

export default async function AdminPagesPage() {
  const existing = await listPages();
  const bySlug = new Map(existing.map((p) => [p.slug, p]));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">内容页管理</h1>
      <p className="text-sm text-gray-500">编辑会场交通、联系方式等富文本内容页。</p>
      {KNOWN.map((k) => {
        const page = bySlug.get(k.slug);
        return (
          <form key={k.slug} action={`/api/admin/pages/${k.slug}`} method="post"
            className="space-y-2 rounded border p-4">
            <h2 className="font-medium">{k.label}<span className="ml-2 text-xs text-gray-400">/{k.slug}</span></h2>
            <input name="title" required defaultValue={page?.title ?? k.label}
              className="w-full rounded border px-3 py-2" placeholder="标题" />
            <textarea name="contentHtml" rows={6} defaultValue={page?.contentHtml ?? ""}
              className="w-full rounded border px-3 py-2 font-mono text-sm" placeholder="正文(HTML)" />
            <button type="submit" className="rounded bg-sky-700 px-4 py-2 text-sm text-white">保存</button>
          </form>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: 后台菜单加入 `/admin/pages`**

修改 `src/app/(admin)/admin/layout.tsx`,在 `MENU` 中 `/admin/notices` 之后插入:

```tsx
  { href: "/admin/pages", label: "内容页" },
```

- [ ] **Step 6: 构建 + 测试**

Run: `npm run build && npm test`
Expected: 构建成功,`/admin/pages`、`/api/admin/pages/[slug]` 出现;测试全 PASS。

- [ ] **Step 7: 提交**

```bash
git add src/lib/pages-admin.ts src/lib/validation.ts src/app/api/admin/pages \
  "src/app/(admin)/admin/pages" "src/app/(admin)/admin/layout.tsx"
git commit -m "feat: 后台内容页编辑(交通/联系)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review(计划编写者自检结果)

- **Spec 覆盖**:对应 spec 第 5 节后台「站点设置」「内容管理(致辞/交通/联系富文本页 + 通知)」「仪表盘」的一部分,并清理前四期累计 minors。讲者/日程/酒店 CRUD、用户管理、CSV 导出由后续子计划(5·乙/5·丙)覆盖。✅
- **占位符扫描**:无 TBD/TODO;每步含完整代码。✅(Task 2 Step 6 给出 `g()` 读取版以正确处理 `null`→`undefined`,避免可选项把 `null` 传进 `.default()`。)
- **类型一致性**:`STATUS_LABEL`(labels)被 6 处复用;`siteConfigSchema`/`noticeSchema`/`pageSchema` 在 validation 定义、各 API 复用;`RouteContext<'…'>` 路径串与目录一致;`updateSiteConfig`/`upsertPage`/notice CRUD 形参与调用处一致。✅
- **安全**:所有新 `/api/admin/*` handler 第一条即 `isAdmin` 守卫(403),与前四期一致。✅
- **已知取舍**:(1) 通知/内容用 `<textarea>` 直接编辑 HTML(无富文本编辑器,YAGNI);(2) `SiteConfig.contactHtml` 仍为历史死字段,联系方式由 Page(contact) 维护,站点设置不含该字段——保持现状,后续如要彻底清理需 schema 迁移;(3) checkbox 的 `isPublished` 经 `=== "on"` 解析(原生表单未勾选不提交该字段)。
