# 阶段三:报名与投稿 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让参会者登录后能在线报名(选择参会类型 + 填表)、提交论文(题目/作者/摘要 + 上传 PDF),在个人中心查看各自的审核状态;管理员在后台审核(通过/拒绝)报名与投稿并下载 PDF。

**Architecture:** 沿用既有分层:读路径用 Server Component 直连 Prisma;写路径走 Route Handler(`route.ts`),用 zod 校验、`auth()` 校验登录态/角色后落库,统一返回 `{ ok, error }`。业务逻辑抽到 `src/lib/*` 的函数中并以 Vitest + 测试库做 TDD(领域函数覆盖"创建→审核→回显"链路)。前台创建表单是 client component 用 `fetch` 提交(与既有登录/注册页一致);后台审核用原生 HTML `form` POST 到受 `isAdmin` 守卫的 route handler,再 303 重定向回列表(无需客户端 JS)。

**Tech Stack:** Next.js 16(Route Handlers、`RouteContext<'…'>`、`params`/`searchParams` 为 Promise)、Prisma 7、Auth.js v5(`auth()`)、zod、Node `fs/promises`(PDF 落盘)、Tailwind、Vitest。

## Global Constraints

- 单会议系统;全部中文 UI 文案。
- **写操作经 Route Handler**(`app/api/**/route.ts`),zod 校验入参,`auth()` 校验登录态/角色后落库,统一 `{ ok: false, error }` 错误结构(参照既有 `src/app/api/register/route.ts`)。前台创建表单为 client component `fetch`;后台审核用原生 HTML `<form method="post">` 提交到 route handler,handler 处理后 `303` 重定向回列表。
- **页面级登录守卫**用 `requireUser()` / `requireAdmin()`(基于 `auth()` + `redirect()`);未登录 `redirect("/login")`,非管理员 `redirect("/")`。
- `/admin/:path*` 由 middleware 守卫页面;但 **`/api/admin/*` 不在该 matcher 内**,review handler 必须在内部用 `isAdmin(session?.user?.role)` 守卫(403)。
- **报名:每个用户仅一条报名**。重复创建抛 `Error("ALREADY_REGISTERED")` → API 返回 409;参会类型不存在抛 `Error("TYPE_NOT_FOUND")` → 400。
- **投稿必须上传 PDF**:仅 `application/pdf`,≤ 10 MB;存 `public/uploads/`(gitignore,不提交),库里存路径 `/uploads/<uuid>.pdf`。
- Next.js 16:动态路由 `params`、页面 `searchParams`、`RouteContext<'…'>.params` 都是 `Promise`,必须 `await`。写 Next 代码前读 `node_modules/next/dist/docs/`。
- 读用 Server Component + `import { prisma } from "@/lib/prisma"`。
- 测试用独立测试库(`tests/setup.ts` 载 `.env.test`),自建并清理数据;注意外键 `onDelete: Restrict`——清理顺序:先删 Registration/Submission,再删 User/RegistrationType。
- 状态枚举字符串:`PENDING | APPROVED | REJECTED`。
- 提交信息中文,结尾 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`。
- 禁止提交 `.env`、`.env.test`、`*.db`、`public/uploads/*`、`.superpowers/`。
- 已复用:`src/lib/prisma.ts`、`src/lib/auth.ts`(`auth`)、`src/lib/access.ts`(`isAdmin`)、`src/lib/validation.ts`、`src/components/RichText.tsx`、`SiteHeader.tsx`(导航已含 `/register-conf`、`/submissions`,"个人中心"链接当前指向 `/` 待改 `/me`)、`(admin)` 布局(导航已含 `/admin/registrations`、`/admin/submissions`)。`next-auth.d.ts` 已把 `session.user.id`、`session.user.role` 加好类型。

## File Structure

- `src/lib/validation.ts` — 修改。新增 `registrationSchema`、`submissionSchema`、`reviewSchema`。
- `src/lib/session.ts` — 创建。`requireUser()`、`requireAdmin()`、`currentUser()`。
- `src/lib/registrations.ts` — 创建。报名领域函数。
- `src/lib/submissions.ts` — 创建。投稿领域函数。
- `src/lib/upload.ts` — 创建。`validatePdf()`(纯)+ `savePdf()`(落盘)。
- `src/app/api/registrations/route.ts` — 创建。POST 创建报名。
- `src/app/api/submissions/route.ts` — 创建。POST 创建投稿(multipart)。
- `src/app/api/admin/registrations/[id]/route.ts` — 创建。POST 审核报名。
- `src/app/api/admin/submissions/[id]/route.ts` — 创建。POST 审核投稿。
- `src/app/(public)/register-conf/page.tsx` — 创建。报名页(server)。
- `src/components/RegistrationForm.tsx` — 创建。报名表单(client)。
- `src/app/(public)/submissions/page.tsx` — 创建。投稿页(server)。
- `src/components/SubmissionForm.tsx` — 创建。投稿表单(client)。
- `src/app/(public)/me/page.tsx` — 创建。个人中心(server)。
- `src/components/SiteHeader.tsx` — 修改。"个人中心"链接改 `/me`。
- `src/app/(admin)/admin/registrations/page.tsx` — 创建。报名管理。
- `src/app/(admin)/admin/submissions/page.tsx` — 创建。论文管理。
- `.gitignore` — 修改。新增 `/public/uploads/`。
- `tests/validation.test.ts`、`tests/registrations.test.ts`、`tests/upload.test.ts`、`tests/submissions.test.ts` — 创建。

---

### Task 1: 报名后端(schemas + 会话守卫 + 领域 + API)

**Files:**
- Modify: `src/lib/validation.ts`
- Create: `src/lib/session.ts`
- Create: `src/lib/registrations.ts`
- Create: `src/app/api/registrations/route.ts`
- Create: `tests/validation.test.ts`
- Create: `tests/registrations.test.ts`

**Interfaces:**
- Consumes: `prisma`、`auth` from `@/lib/auth`、`isAdmin` from `@/lib/access`。
- Produces:
  - `registrationSchema` / `RegistrationInput`、`submissionSchema` / `SubmissionInput`、`reviewSchema`(三个 schema 一次性加好,后续任务复用)。
  - `requireUser(): Promise<SessionUser>`、`requireAdmin(): Promise<SessionUser>`、`currentUser(): Promise<SessionUser | null>`(`SessionUser` 即 `NonNullable<Awaited<ReturnType<typeof auth>>>["user"]`,含 `id`、`role`)。
  - `createRegistration(userId: string, input: RegistrationInput): Promise<Registration>` — 已有报名抛 `ALREADY_REGISTERED`;类型不存在抛 `TYPE_NOT_FOUND`。
  - `getUserRegistration(userId: string): Promise<(Registration & { type: RegistrationType }) | null>`。
  - `listRegistrations(): Promise<(Registration & { user: User; type: RegistrationType })[]>`(按 createdAt 降序)。
  - `reviewRegistration(id: string, decision: "APPROVED" | "REJECTED"): Promise<Registration>`。

- [ ] **Step 1: 为 schemas 写失败测试**

创建 `tests/validation.test.ts`:

```ts
import { expect, test } from "vitest";
import { registrationSchema, submissionSchema, reviewSchema } from "@/lib/validation";

test("registrationSchema 必填校验与默认值", () => {
  expect(registrationSchema.safeParse({ typeId: "", fullName: "" }).success).toBe(false);
  const ok = registrationSchema.safeParse({ typeId: "t1", fullName: "张三" });
  expect(ok.success).toBe(true);
  if (ok.success) expect(ok.data.organization).toBe("");
});

test("submissionSchema 必填校验", () => {
  expect(submissionSchema.safeParse({ title: "", authors: "a", abstract: "b" }).success).toBe(false);
  expect(submissionSchema.safeParse({ title: "t", authors: "a", abstract: "b" }).success).toBe(true);
});

test("reviewSchema 仅接受 APPROVED/REJECTED", () => {
  expect(reviewSchema.safeParse({ decision: "APPROVED" }).success).toBe(true);
  expect(reviewSchema.safeParse({ decision: "MAYBE" }).success).toBe(false);
});
```

- [ ] **Step 2: 运行测试,确认失败**

Run: `npm test -- tests/validation.test.ts`
Expected: FAIL,无法从 `@/lib/validation` 解析 `registrationSchema`(尚未导出)。

- [ ] **Step 3: 在 `src/lib/validation.ts` 追加 schemas**

在文件末尾追加(保留已有 `registerSchema`):

```ts
export const registrationSchema = z.object({
  typeId: z.string().min(1, "请选择参会类型"),
  fullName: z.string().min(1, "请填写姓名"),
  organization: z.string().optional().default(""),
  title: z.string().optional().default(""),
  phone: z.string().optional().default(""),
});
export type RegistrationInput = z.infer<typeof registrationSchema>;

export const submissionSchema = z.object({
  title: z.string().min(1, "请填写论文题目"),
  authors: z.string().min(1, "请填写作者"),
  abstract: z.string().min(1, "请填写摘要"),
});
export type SubmissionInput = z.infer<typeof submissionSchema>;

export const reviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
});
```

- [ ] **Step 4: 运行测试,确认通过**

Run: `npm test -- tests/validation.test.ts`
Expected: PASS(3 passing)。

- [ ] **Step 5: 创建 `src/lib/session.ts`**

```ts
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";

type SessionUser = NonNullable<NonNullable<Awaited<ReturnType<typeof auth>>>["user"]>;

export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.role)) redirect("/");
  return user;
}
```

(说明:`session.ts` 依赖 `redirect()`/`auth()`,属薄守卫层,不单独单测;其分支由页面集成与 `isAdmin` 既有测试间接覆盖。)

- [ ] **Step 6: 为报名领域函数写失败测试**

创建 `tests/registrations.test.ts`:

```ts
import { afterAll, beforeAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createRegistration,
  getUserRegistration,
  reviewRegistration,
} from "@/lib/registrations";

let userId: string;
let typeId: string;

beforeAll(async () => {
  const u = await prisma.user.create({
    data: { name: "报名测试", email: "regtest@example.com", passwordHash: "x" },
  });
  userId = u.id;
  const t = await prisma.registrationType.create({ data: { name: "测试类型", fee: 100 } });
  typeId = t.id;
});

afterAll(async () => {
  await prisma.registration.deleteMany({ where: { userId } });
  await prisma.registrationType.delete({ where: { id: typeId } }).catch(() => {});
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await prisma.$disconnect();
});

test("创建报名→重复报名抛错→审核回显状态", async () => {
  const reg = await createRegistration(userId, {
    typeId, fullName: "张三", organization: "", title: "", phone: "",
  });
  expect(reg.status).toBe("PENDING");

  await expect(
    createRegistration(userId, { typeId, fullName: "张三", organization: "", title: "", phone: "" }),
  ).rejects.toThrow("ALREADY_REGISTERED");

  const mine = await getUserRegistration(userId);
  expect(mine?.type.name).toBe("测试类型");

  const reviewed = await reviewRegistration(reg.id, "APPROVED");
  expect(reviewed.status).toBe("APPROVED");
  expect((await getUserRegistration(userId))?.status).toBe("APPROVED");
});

test("参会类型不存在时抛 TYPE_NOT_FOUND", async () => {
  await expect(
    createRegistration("no-such-user", {
      typeId: "no-such-type", fullName: "x", organization: "", title: "", phone: "",
    }),
  ).rejects.toThrow("TYPE_NOT_FOUND");
});
```

- [ ] **Step 7: 运行测试,确认失败**

Run: `npm test -- tests/registrations.test.ts`
Expected: FAIL,无法解析 `@/lib/registrations`。

- [ ] **Step 8: 实现 `src/lib/registrations.ts`**

```ts
import { prisma } from "@/lib/prisma";
import type { RegistrationInput } from "@/lib/validation";

export async function createRegistration(userId: string, input: RegistrationInput) {
  const existing = await prisma.registration.findFirst({ where: { userId } });
  if (existing) throw new Error("ALREADY_REGISTERED");
  const type = await prisma.registrationType.findUnique({ where: { id: input.typeId } });
  if (!type) throw new Error("TYPE_NOT_FOUND");
  return prisma.registration.create({
    data: {
      userId,
      typeId: input.typeId,
      fullName: input.fullName,
      organization: input.organization ?? "",
      title: input.title ?? "",
      phone: input.phone ?? "",
    },
  });
}

export function getUserRegistration(userId: string) {
  return prisma.registration.findFirst({
    where: { userId },
    include: { type: true },
  });
}

export function listRegistrations() {
  return prisma.registration.findMany({
    include: { user: true, type: true },
    orderBy: { createdAt: "desc" },
  });
}

export function reviewRegistration(id: string, decision: "APPROVED" | "REJECTED") {
  return prisma.registration.update({ where: { id }, data: { status: decision } });
}
```

- [ ] **Step 9: 运行测试,确认通过**

Run: `npm test -- tests/registrations.test.ts`
Expected: PASS(2 passing)。

- [ ] **Step 10: 创建报名 API `src/app/api/registrations/route.ts`**

```ts
import { NextResponse } from "next/server";
import { registrationSchema } from "@/lib/validation";
import { currentUser } from "@/lib/session";
import { createRegistration } from "@/lib/registrations";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }
  try {
    const reg = await createRegistration(user.id, parsed.data);
    return NextResponse.json({ ok: true, id: reg.id });
  } catch (e) {
    if (e instanceof Error && e.message === "ALREADY_REGISTERED") {
      return NextResponse.json({ ok: false, error: "您已报名,不能重复提交" }, { status: 409 });
    }
    if (e instanceof Error && e.message === "TYPE_NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "参会类型不存在" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "报名失败" }, { status: 500 });
  }
}
```

- [ ] **Step 11: 运行全量测试**

Run: `npm test`
Expected: 既有 28 + 本任务新增(validation 3 + registrations 2)全部 PASS,输出干净。

- [ ] **Step 12: 提交**

```bash
git add src/lib/validation.ts src/lib/session.ts src/lib/registrations.ts \
  src/app/api/registrations/route.ts tests/validation.test.ts tests/registrations.test.ts
git commit -m "feat: 报名后端(校验/会话守卫/领域/接口)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: 报名前台(/register-conf + 表单)

**Files:**
- Create: `src/app/(public)/register-conf/page.tsx`
- Create: `src/components/RegistrationForm.tsx`

**Interfaces:**
- Consumes: `requireUser` from `@/lib/session`、`getUserRegistration` from `@/lib/registrations`、`prisma`(读 `registrationType`)。
- Produces: 前台路由 `/register-conf`(已在导航)。

- [ ] **Step 1: 创建报名表单 client 组件 `src/components/RegistrationForm.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type TypeOption = { id: string; name: string; fee: number };

export default function RegistrationForm({ types }: { types: TypeOption[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeId: fd.get("typeId"),
          fullName: fd.get("fullName"),
          organization: fd.get("organization"),
          title: fd.get("title"),
          phone: fd.get("phone"),
        }),
      });
      const data = await res.json().catch(() => ({ ok: false, error: "服务器错误" }));
      if (!data.ok) {
        setError(data.error ?? "报名失败");
        return;
      }
      router.push("/me");
      router.refresh();
    } catch {
      setError("网络错误,请重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-3">
      <select name="typeId" required className="w-full rounded border px-3 py-2">
        <option value="">请选择参会类型</option>
        {types.map((t) => (
          <option key={t.id} value={t.id}>{t.name}(¥{t.fee})</option>
        ))}
      </select>
      <input name="fullName" required placeholder="姓名" className="w-full rounded border px-3 py-2" />
      <input name="organization" placeholder="单位" className="w-full rounded border px-3 py-2" />
      <input name="title" placeholder="职称/职务" className="w-full rounded border px-3 py-2" />
      <input name="phone" placeholder="联系电话" className="w-full rounded border px-3 py-2" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="rounded bg-sky-700 px-4 py-2 text-white disabled:opacity-50">
        {submitting ? "提交中…" : "提交报名"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: 创建报名页 `src/app/(public)/register-conf/page.tsx`**

```tsx
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getUserRegistration } from "@/lib/registrations";
import { prisma } from "@/lib/prisma";
import RegistrationForm from "@/components/RegistrationForm";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "未通过",
};

export default async function RegisterConfPage() {
  const user = await requireUser();
  const existing = await getUserRegistration(user.id);

  if (existing) {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-bold">注册报名</h1>
        <p>您已提交报名,当前状态:
          <span className="font-medium text-sky-700">{STATUS_LABEL[existing.status] ?? existing.status}</span>
        </p>
        <p className="text-sm text-gray-500">参会类型:{existing.type.name}</p>
        <Link href="/me" className="text-sky-700 hover:underline">前往个人中心</Link>
      </section>
    );
  }

  const types = await prisma.registrationType.findMany({ orderBy: { fee: "asc" } });
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">注册报名</h1>
      <RegistrationForm types={types.map((t) => ({ id: t.id, name: t.name, fee: t.fee }))} />
    </section>
  );
}
```

- [ ] **Step 3: 构建验证**

Run: `npm run build`
Expected: 构建成功,无类型错误;`/register-conf` 路由出现在输出中。

- [ ] **Step 4: 运行全量测试(确认无回归)**

Run: `npm test`
Expected: 全部 PASS(本任务无新测试,纯 UI;依赖 Task 1 的领域测试)。

- [ ] **Step 5: 提交**

```bash
git add "src/app/(public)/register-conf" src/components/RegistrationForm.tsx
git commit -m "feat: 报名前台页与表单

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: 投稿后端(上传 + 领域 + API)

**Files:**
- Create: `src/lib/upload.ts`
- Create: `src/lib/submissions.ts`
- Create: `src/app/api/submissions/route.ts`
- Create: `tests/upload.test.ts`
- Create: `tests/submissions.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `prisma`、`currentUser`、`submissionSchema`(Task 1 已产出)。
- Produces:
  - `validatePdf(file: { type: string; size: number }): string | null` — 合法返回 `null`,否则返回中文错误信息。
  - `savePdf(file: File): Promise<string>` — 落盘到 `public/uploads/<uuid>.pdf`,返回 `"/uploads/<uuid>.pdf"`。
  - `createSubmission(userId: string, data: { title: string; authors: string; abstract: string; fileUrl: string | null }): Promise<Submission>`。
  - `listUserSubmissions(userId: string): Promise<Submission[]>`(按 createdAt 降序)。
  - `listSubmissions(): Promise<(Submission & { user: User })[]>`(按 createdAt 降序)。
  - `reviewSubmission(id: string, decision: "APPROVED" | "REJECTED"): Promise<Submission>`。

- [ ] **Step 1: 为 `validatePdf` 写失败测试**

创建 `tests/upload.test.ts`:

```ts
import { expect, test } from "vitest";
import { validatePdf } from "@/lib/upload";

test("接受 PDF", () => {
  expect(validatePdf({ type: "application/pdf", size: 1000 })).toBeNull();
});

test("拒绝非 PDF 类型", () => {
  expect(validatePdf({ type: "image/png", size: 1000 })).toBe("仅支持 PDF 文件");
});

test("拒绝超过 10MB 的文件", () => {
  expect(validatePdf({ type: "application/pdf", size: 11 * 1024 * 1024 })).toBe("文件不能超过 10MB");
});
```

- [ ] **Step 2: 运行测试,确认失败**

Run: `npm test -- tests/upload.test.ts`
Expected: FAIL,无法解析 `@/lib/upload`。

- [ ] **Step 3: 实现 `src/lib/upload.ts`**

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

const MAX_BYTES = 10 * 1024 * 1024;

/** 合法返回 null,否则返回中文错误信息。 */
export function validatePdf(file: { type: string; size: number }): string | null {
  if (file.type !== "application/pdf") return "仅支持 PDF 文件";
  if (file.size > MAX_BYTES) return "文件不能超过 10MB";
  return null;
}

export async function savePdf(file: File): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.pdf`;
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buf);
  return `/uploads/${name}`;
}
```

- [ ] **Step 4: 运行测试,确认通过**

Run: `npm test -- tests/upload.test.ts`
Expected: PASS(3 passing)。

- [ ] **Step 5: 为投稿领域函数写失败测试**

创建 `tests/submissions.test.ts`:

```ts
import { afterAll, beforeAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createSubmission,
  listUserSubmissions,
  reviewSubmission,
} from "@/lib/submissions";

let userId: string;

beforeAll(async () => {
  const u = await prisma.user.create({
    data: { name: "投稿测试", email: "subtest@example.com", passwordHash: "x" },
  });
  userId = u.id;
});

afterAll(async () => {
  await prisma.submission.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await prisma.$disconnect();
});

test("创建投稿→列出用户投稿→审核回显", async () => {
  const sub = await createSubmission(userId, {
    title: "论文A", authors: "张三", abstract: "摘要", fileUrl: "/uploads/x.pdf",
  });
  expect(sub.status).toBe("PENDING");

  const list = await listUserSubmissions(userId);
  expect(list).toHaveLength(1);
  expect(list[0].title).toBe("论文A");

  const reviewed = await reviewSubmission(sub.id, "REJECTED");
  expect(reviewed.status).toBe("REJECTED");
});
```

- [ ] **Step 6: 运行测试,确认失败**

Run: `npm test -- tests/submissions.test.ts`
Expected: FAIL,无法解析 `@/lib/submissions`。

- [ ] **Step 7: 实现 `src/lib/submissions.ts`**

```ts
import { prisma } from "@/lib/prisma";

export function createSubmission(
  userId: string,
  data: { title: string; authors: string; abstract: string; fileUrl: string | null },
) {
  return prisma.submission.create({ data: { userId, ...data } });
}

export function listUserSubmissions(userId: string) {
  return prisma.submission.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export function listSubmissions() {
  return prisma.submission.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
}

export function reviewSubmission(id: string, decision: "APPROVED" | "REJECTED") {
  return prisma.submission.update({ where: { id }, data: { status: decision } });
}
```

- [ ] **Step 8: 运行测试,确认通过**

Run: `npm test -- tests/submissions.test.ts`
Expected: PASS(1 passing)。

- [ ] **Step 9: 创建投稿 API `src/app/api/submissions/route.ts`**

```ts
import { NextResponse } from "next/server";
import { submissionSchema } from "@/lib/validation";
import { currentUser } from "@/lib/session";
import { validatePdf, savePdf } from "@/lib/upload";
import { createSubmission } from "@/lib/submissions";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });

  const parsed = submissionSchema.safeParse({
    title: form.get("title"),
    authors: form.get("authors"),
    abstract: form.get("abstract"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "请上传 PDF 文件" }, { status: 400 });
  }
  const fileError = validatePdf({ type: file.type, size: file.size });
  if (fileError) return NextResponse.json({ ok: false, error: fileError }, { status: 400 });

  const fileUrl = await savePdf(file);
  const sub = await createSubmission(user.id, { ...parsed.data, fileUrl });
  return NextResponse.json({ ok: true, id: sub.id });
}
```

- [ ] **Step 10: 把上传目录加入 `.gitignore`**

在 `.gitignore` 末尾追加一行(若尚不存在):

```
/public/uploads/
```

- [ ] **Step 11: 运行全量测试**

Run: `npm test`
Expected: 全部 PASS(新增 upload 3 + submissions 1),输出干净。

- [ ] **Step 12: 提交**

```bash
git add src/lib/upload.ts src/lib/submissions.ts src/app/api/submissions/route.ts \
  tests/upload.test.ts tests/submissions.test.ts .gitignore
git commit -m "feat: 投稿后端(PDF 上传/领域/接口)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: 投稿前台 + 个人中心

**Files:**
- Create: `src/components/SubmissionForm.tsx`
- Create: `src/app/(public)/submissions/page.tsx`
- Create: `src/app/(public)/me/page.tsx`
- Modify: `src/components/SiteHeader.tsx`

**Interfaces:**
- Consumes: `requireUser`、`listUserSubmissions`、`getUserRegistration`。
- Produces: 前台路由 `/submissions`、`/me`(已在导航/头部)。

- [ ] **Step 1: 创建投稿表单 client 组件 `src/components/SubmissionForm.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SubmissionForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const form = e.currentTarget;
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        body: new FormData(form),
      });
      const data = await res.json().catch(() => ({ ok: false, error: "服务器错误" }));
      if (!data.ok) {
        setError(data.error ?? "提交失败");
        return;
      }
      form.reset();
      router.refresh();
    } catch {
      setError("网络错误,请重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-3">
      <input name="title" required placeholder="论文题目" className="w-full rounded border px-3 py-2" />
      <input name="authors" required placeholder="作者(多位用、分隔)" className="w-full rounded border px-3 py-2" />
      <textarea name="abstract" required placeholder="摘要" rows={4} className="w-full rounded border px-3 py-2" />
      <input name="file" type="file" accept="application/pdf" required className="w-full text-sm" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="rounded bg-sky-700 px-4 py-2 text-white disabled:opacity-50">
        {submitting ? "提交中…" : "提交论文"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: 创建投稿页 `src/app/(public)/submissions/page.tsx`**

```tsx
import { requireUser } from "@/lib/session";
import { listUserSubmissions } from "@/lib/submissions";
import SubmissionForm from "@/components/SubmissionForm";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "未通过",
};

export default async function SubmissionsPage() {
  const user = await requireUser();
  const subs = await listUserSubmissions(user.id);
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">论文提交</h1>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">我的投稿</h2>
        {subs.length === 0 ? (
          <p className="text-gray-500">暂无投稿。</p>
        ) : (
          <ul className="divide-y rounded border">
            {subs.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="font-medium">{s.title}</span>
                <span className="text-gray-400">{s.authors}</span>
                <span className="ml-auto text-sky-700">{STATUS_LABEL[s.status] ?? s.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">提交新论文</h2>
        <SubmissionForm />
      </div>
    </section>
  );
}
```

- [ ] **Step 3: 创建个人中心 `src/app/(public)/me/page.tsx`**

```tsx
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getUserRegistration } from "@/lib/registrations";
import { listUserSubmissions } from "@/lib/submissions";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "未通过",
};

export default async function MePage() {
  const user = await requireUser();
  const [registration, submissions] = await Promise.all([
    getUserRegistration(user.id),
    listUserSubmissions(user.id),
  ]);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">个人中心</h1>
      <p className="text-gray-600">{user.name}（{user.email}）</p>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">我的报名</h2>
        {registration ? (
          <p className="text-sm">
            {registration.type.name} ·
            <span className="ml-1 text-sky-700">{STATUS_LABEL[registration.status] ?? registration.status}</span>
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            尚未报名。<Link href="/register-conf" className="text-sky-700 hover:underline">去报名</Link>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">我的投稿</h2>
        {submissions.length === 0 ? (
          <p className="text-sm text-gray-500">
            尚无投稿。<Link href="/submissions" className="text-sky-700 hover:underline">去投稿</Link>
          </p>
        ) : (
          <ul className="divide-y rounded border">
            {submissions.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="font-medium">{s.title}</span>
                <span className="ml-auto text-sky-700">{STATUS_LABEL[s.status] ?? s.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 头部"个人中心"链接改 `/me`**

修改 `src/components/SiteHeader.tsx`,把登录态分支里的 TODO 链接替换:

```tsx
        <div className="ml-auto text-sm">
          {session?.user ? (
            <Link href="/me" className="text-sky-700">个人中心</Link>
          ) : (
            <Link href="/login" className="text-sky-700">登录 / 注册</Link>
          )}
        </div>
```

(删除原来的 `// TODO Phase 2: 个人中心 /me` 注释与指向 `/` 的链接。)

- [ ] **Step 5: 构建验证**

Run: `npm run build`
Expected: 构建成功,无类型错误;`/submissions`、`/me` 路由出现。

- [ ] **Step 6: 运行全量测试**

Run: `npm test`
Expected: 全部 PASS(无新测试)。

- [ ] **Step 7: 提交**

```bash
git add src/components/SubmissionForm.tsx "src/app/(public)/submissions" \
  "src/app/(public)/me" src/components/SiteHeader.tsx
git commit -m "feat: 投稿前台与个人中心

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: 后台审核(报名管理 + 论文管理 + review 接口)

**Files:**
- Create: `src/app/api/admin/registrations/[id]/route.ts`
- Create: `src/app/api/admin/submissions/[id]/route.ts`
- Create: `src/app/(admin)/admin/registrations/page.tsx`
- Create: `src/app/(admin)/admin/submissions/page.tsx`

**Interfaces:**
- Consumes: `auth`、`isAdmin`、`reviewSchema`、`listRegistrations`/`reviewRegistration`、`listSubmissions`/`reviewSubmission`。
- Produces: 后台路由 `/admin/registrations`、`/admin/submissions`(已在后台导航);两个审核 route handler。

- [ ] **Step 1: 创建报名审核 API `src/app/api/admin/registrations/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { reviewSchema } from "@/lib/validation";
import { reviewRegistration } from "@/lib/registrations";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/registrations/[id]">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const parsed = reviewSchema.safeParse({ decision: form?.get("decision") });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });
  }
  await reviewRegistration(id, parsed.data.decision);
  return NextResponse.redirect(new URL("/admin/registrations", req.url), { status: 303 });
}
```

- [ ] **Step 2: 创建论文审核 API `src/app/api/admin/submissions/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { reviewSchema } from "@/lib/validation";
import { reviewSubmission } from "@/lib/submissions";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/submissions/[id]">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const parsed = reviewSchema.safeParse({ decision: form?.get("decision") });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });
  }
  await reviewSubmission(id, parsed.data.decision);
  return NextResponse.redirect(new URL("/admin/submissions", req.url), { status: 303 });
}
```

- [ ] **Step 3: 创建报名管理页 `src/app/(admin)/admin/registrations/page.tsx`**

```tsx
import { listRegistrations } from "@/lib/registrations";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "未通过",
};

function ReviewButtons({ id }: { id: string }) {
  return (
    <div className="flex gap-2">
      <form action={`/api/admin/registrations/${id}`} method="post">
        <input type="hidden" name="decision" value="APPROVED" />
        <button type="submit" className="rounded bg-green-600 px-2 py-1 text-xs text-white">通过</button>
      </form>
      <form action={`/api/admin/registrations/${id}`} method="post">
        <input type="hidden" name="decision" value="REJECTED" />
        <button type="submit" className="rounded bg-red-600 px-2 py-1 text-xs text-white">拒绝</button>
      </form>
    </div>
  );
}

export default async function AdminRegistrationsPage() {
  const regs = await listRegistrations();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">报名管理</h1>
      {regs.length === 0 ? (
        <p className="text-gray-500">暂无报名。</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">姓名</th><th>邮箱</th><th>类型</th><th>单位</th><th>状态</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {regs.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-2">{r.fullName}</td>
                <td>{r.user.email}</td>
                <td>{r.type.name}</td>
                <td>{r.organization}</td>
                <td className="text-sky-700">{STATUS_LABEL[r.status] ?? r.status}</td>
                <td><ReviewButtons id={r.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 创建论文管理页 `src/app/(admin)/admin/submissions/page.tsx`**

```tsx
import { listSubmissions } from "@/lib/submissions";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "未通过",
};

function ReviewButtons({ id }: { id: string }) {
  return (
    <div className="flex gap-2">
      <form action={`/api/admin/submissions/${id}`} method="post">
        <input type="hidden" name="decision" value="APPROVED" />
        <button type="submit" className="rounded bg-green-600 px-2 py-1 text-xs text-white">通过</button>
      </form>
      <form action={`/api/admin/submissions/${id}`} method="post">
        <input type="hidden" name="decision" value="REJECTED" />
        <button type="submit" className="rounded bg-red-600 px-2 py-1 text-xs text-white">拒绝</button>
      </form>
    </div>
  );
}

export default async function AdminSubmissionsPage() {
  const subs = await listSubmissions();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">论文管理</h1>
      {subs.length === 0 ? (
        <p className="text-gray-500">暂无投稿。</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">题目</th><th>作者</th><th>提交人</th><th>PDF</th><th>状态</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-b align-top">
                <td className="py-2">{s.title}</td>
                <td>{s.authors}</td>
                <td>{s.user.email}</td>
                <td>
                  {s.fileUrl ? (
                    <a href={s.fileUrl} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">下载</a>
                  ) : (
                    <span className="text-gray-400">无</span>
                  )}
                </td>
                <td className="text-sky-700">{STATUS_LABEL[s.status] ?? s.status}</td>
                <td><ReviewButtons id={s.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 5: 构建验证**

Run: `npm run build`
Expected: 构建成功,无类型错误;`/admin/registrations`、`/admin/submissions`、两个 `/api/admin/...` 路由出现。

- [ ] **Step 6: 运行全量测试**

Run: `npm test`
Expected: 全部 PASS(审核领域函数已在 Task 1/3 测过)。

- [ ] **Step 7: 提交**

```bash
git add src/app/api/admin "src/app/(admin)/admin/registrations" "src/app/(admin)/admin/submissions"
git commit -m "feat: 后台报名与论文审核

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review(计划编写者自检结果)

- **Spec 覆盖**:对应 spec 第 9 节第三期"报名与投稿":报名表+类型(Task 1/2)、论文提交+PDF(Task 3/4)、个人中心(Task 4)、后台审核(Task 5)。✅ 与 spec 第 4 节 #3/#4/#13、第 5 节"报名管理/论文管理"一致。
- **占位符扫描**:无 TBD/TODO;每个代码步骤含完整代码;`SiteHeader` 的旧 TODO 注释在 Task 4 Step 4 被显式移除。✅
- **类型/签名一致性**:`reviewSchema`/`submissionSchema`/`registrationSchema` 在 Task 1 一次性定义,Task 3/5 复用;`currentUser`/`requireUser` 在 Task 1 定义,Task 2/3/4 复用;`RouteContext<'/api/admin/...'>` 路径串与文件目录一致。审核函数 `reviewRegistration`/`reviewSubmission` 形参与调用处一致。✅
- **测试策略**:领域层覆盖"创建→(重复/类型错误)→审核→回显"链路(spec 第 8 节要求的报名/投稿审核回显);`validatePdf`、三个 schema 为纯函数测试;UI 与 route handler 由 `npm run build` + 领域测试间接保障(集成 HTTP 测试因需模拟 Auth.js 会话成本高,本期不做,留待第五期补关键 e2e)。⚠️ 已知取舍。
- **已知取舍**:(1) `session.ts` 守卫层依赖 `redirect()`,不单测;(2) 后台审核 API 的 `isAdmin` 守卫无自动化测试(同上,需会话模拟),靠代码评审把关——评审须确认 `/api/admin/*` 不在 middleware matcher 内、必须 handler 内守卫;(3) 上传仅按 `file.type`/`size` 校验,不解析 PDF 魔数(YAGNI,管理员人工下载核对);(4) 报名"每人一条"为产品决策,如需可编辑/可改期,留后续。
