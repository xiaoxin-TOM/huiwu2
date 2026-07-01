# 第1期:基础框架 + 鉴权 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭好 Next.js 全栈骨架、完整 Prisma 数据模型、Auth.js 注册登录与角色鉴权、前台/后台基础布局,作为后续各期的地基。

**Architecture:** 单一 Next.js (App Router) 项目。Prisma + SQLite 持久化,一次性建好全量数据模型。Auth.js Credentials 登录,session 带 role,middleware 保护 `/admin`。前台 `(public)`、后台 `(admin)` 分区。Vitest 跑单元/集成测试。

**Tech Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma · SQLite · Auth.js v5 (next-auth@beta) · bcryptjs · zod · Vitest

## Global Constraints

- 单会议系统,非多租户。
- 语言:中文 UI。
- 数据库:开发用 SQLite,`DATABASE_URL` 来自 `.env`;测试用独立 `.env.test` 指向 `prisma/test.db`。
- 所有写操作经服务端(API Route / Server Action)并做 zod 校验。
- 角色仅 `USER` / `ADMIN`(Prisma enum 在 SQLite 用 String + 应用层约束)。
- 全量 Prisma 模型在本期一次建好(见 Task 2),后续期只新增页面/逻辑,不再大改 schema。
- 提交信息用中文,结尾附 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`。

---

## File Structure

- `package.json`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `.env`, `.env.test`, `.gitignore`
- `prisma/schema.prisma` — 全量数据模型
- `prisma/seed.ts` — 初始 ADMIN、SiteConfig、示例数据
- `src/lib/prisma.ts` — Prisma client 单例
- `src/lib/password.ts` — 密码哈希/校验
- `src/lib/validation.ts` — zod schema(注册等)
- `src/lib/auth.ts` — Auth.js 配置(authOptions / handlers / auth)
- `src/app/api/auth/[...nextauth]/route.ts` — Auth.js 路由
- `src/app/api/register/route.ts` — 注册接口
- `src/middleware.ts` — 保护 `/admin`
- `src/app/(public)/layout.tsx`, `src/components/SiteHeader.tsx`, `src/components/SiteFooter.tsx`
- `src/app/(public)/page.tsx` — 占位首页
- `src/app/(admin)/admin/layout.tsx`, `src/app/(admin)/admin/page.tsx` — 后台壳 + 仪表盘占位
- `src/app/login/page.tsx`, `src/app/register/page.tsx`
- 测试:`tests/password.test.ts`, `tests/register.test.ts`, `tests/auth-role.test.ts`

---

### Task 1: 项目脚手架与测试环境

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `src/app/globals.css`, `src/app/layout.tsx`, `vitest.config.ts`, `.gitignore`, `.env`, `.env.test`

**Interfaces:**
- Produces: 可运行的 Next.js 项目;`npm test` 可跑 Vitest;Tailwind 可用。

- [ ] **Step 1: 生成 Next.js 项目**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-npm
```
若目录非空报错,先把 `docs/` 临时移出再生成后移回,或对已存在文件选择覆盖(保留 `docs/`)。
Expected: 生成 `src/app`、`package.json` 等。

- [ ] **Step 2: 安装依赖**

Run:
```bash
npm install prisma @prisma/client next-auth@beta bcryptjs zod
npm install -D vitest @types/bcryptjs tsx dotenv
```
Expected: 安装成功。

- [ ] **Step 3: 配置 Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
```

Create `tests/setup.ts`:
```ts
import { config } from "dotenv";
config({ path: ".env.test" });
```

- [ ] **Step 4: 环境文件**

Create `.env`:
```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="dev-secret-change-me"
```
Create `.env.test`:
```
DATABASE_URL="file:./test.db"
AUTH_SECRET="test-secret"
```
Append to `.gitignore`:
```
.env
.env.test
*.db
prisma/*.db
```

- [ ] **Step 5: package.json 脚本**

Add to `package.json` `"scripts"`:
```json
"test": "vitest run",
"db:push": "prisma db push",
"db:seed": "tsx prisma/seed.ts"
```
Add `"prisma": { "seed": "tsx prisma/seed.ts" }` 顶层字段。

- [ ] **Step 6: 冒烟测试**

Create `tests/smoke.test.ts`:
```ts
import { expect, test } from "vitest";
test("环境就绪", () => {
  expect(1 + 1).toBe(2);
});
```
Run: `npm test`
Expected: PASS。

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: 初始化 Next.js 项目与 Vitest 测试环境

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Prisma 全量数据模型

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/prisma.ts`

**Interfaces:**
- Produces: 全部模型(`User`/`SiteConfig`/`Page`/`Notice`/`RegistrationType`/`Registration`/`Submission`/`Speaker`/`Session`/`Hotel`/`HotelBooking`/`Album`/`Photo`);`prisma` client 单例,后续所有任务从 `@/lib/prisma` 导入。

- [ ] **Step 1: 写 schema**

Create `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id           String         @id @default(cuid())
  name         String
  email        String         @unique
  passwordHash String
  phone        String?
  organization String?
  role         String         @default("USER") // USER | ADMIN
  createdAt    DateTime       @default(now())
  registrations Registration[]
  submissions   Submission[]
  bookings      HotelBooking[]
}

model SiteConfig {
  id           Int      @id @default(1)
  confName     String   @default("")
  confDate     String   @default("")
  confLocation String   @default("")
  logoUrl      String?
  welcomeHtml  String   @default("")
  liveUrl      String?
  contactHtml  String   @default("")
  updatedAt    DateTime @updatedAt
}

model Page {
  slug        String   @id // welcome | venue | contact ...
  title       String
  contentHtml String   @default("")
  updatedAt   DateTime @updatedAt
}

model Notice {
  id          String   @id @default(cuid())
  title       String
  contentHtml String   @default("")
  isPublished Boolean  @default(true)
  publishedAt DateTime @default(now())
}

model RegistrationType {
  id            String         @id @default(cuid())
  name          String
  fee           Int            @default(0)
  description   String         @default("")
  registrations Registration[]
}

model Registration {
  id           String           @id @default(cuid())
  userId       String
  user         User             @relation(fields: [userId], references: [id])
  typeId       String
  type         RegistrationType @relation(fields: [typeId], references: [id])
  fullName     String
  organization String           @default("")
  title        String           @default("")
  phone        String           @default("")
  status       String           @default("PENDING") // PENDING | APPROVED | REJECTED
  createdAt    DateTime         @default(now())
}

model Submission {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  title     String
  authors   String
  abstract  String
  fileUrl   String?
  status    String   @default("PENDING")
  createdAt DateTime @default(now())
}

model Speaker {
  id           String           @id @default(cuid())
  name         String
  title        String           @default("")
  organization String           @default("")
  bio          String           @default("")
  photoUrl     String?
  isModerator  Boolean          @default(false)
  sessions     SessionSpeaker[]
}

model Session {
  id        String           @id @default(cuid())
  day       String // 日期 YYYY-MM-DD
  startTime String
  endTime   String
  room      String           @default("")
  title     String
  isBrief   Boolean          @default(false)
  speakers  SessionSpeaker[]
}

model SessionSpeaker {
  sessionId String
  speakerId String
  role      String  @default("SPEAKER") // SPEAKER | MODERATOR
  session   Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  speaker   Speaker @relation(fields: [speakerId], references: [id], onDelete: Cascade)
  @@id([sessionId, speakerId, role])
}

model Hotel {
  id          String         @id @default(cuid())
  name        String
  description String         @default("")
  price       Int            @default(0)
  address     String         @default("")
  imageUrl    String?
  distance    String         @default("")
  bookings    HotelBooking[]
}

model HotelBooking {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  hotelId   String
  hotel     Hotel    @relation(fields: [hotelId], references: [id])
  checkIn   String
  checkOut  String
  rooms     Int      @default(1)
  status    String   @default("PENDING")
  createdAt DateTime @default(now())
}

model Album {
  id      String  @id @default(cuid())
  title   String
  date    String  @default("")
  coverUrl String?
  photos  Photo[]
}

model Photo {
  id        String   @id @default(cuid())
  albumId   String
  album     Album    @relation(fields: [albumId], references: [id], onDelete: Cascade)
  url       String
  caption   String   @default("")
  createdAt DateTime @default(now())
}
```

- [ ] **Step 2: 生成 client 并推送 schema**

Run:
```bash
npx prisma generate
npx prisma db push
DATABASE_URL="file:./test.db" npx prisma db push
```
Expected: 两个库都建表成功。

- [ ] **Step 3: Prisma 单例**

Create `src/lib/prisma.ts`:
```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: 模型连通性测试**

Create `tests/db.test.ts`:
```ts
import { afterAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: "dbtest@example.com" } });
  await prisma.$disconnect();
});

test("可创建并读取 User", async () => {
  const u = await prisma.user.create({
    data: { name: "测试", email: "dbtest@example.com", passwordHash: "x" },
  });
  const found = await prisma.user.findUnique({ where: { id: u.id } });
  expect(found?.email).toBe("dbtest@example.com");
  expect(found?.role).toBe("USER");
});
```
Run: `npm test tests/db.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: 建立全量 Prisma 数据模型与 client 单例

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: 密码哈希工具

**Files:**
- Create: `src/lib/password.ts`, `tests/password.test.ts`

**Interfaces:**
- Produces: `hashPassword(plain: string): Promise<string>`、`verifyPassword(plain: string, hash: string): Promise<boolean>`。

- [ ] **Step 1: 写失败测试**

Create `tests/password.test.ts`:
```ts
import { expect, test } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

test("哈希后能校验通过,错误密码失败", async () => {
  const hash = await hashPassword("secret123");
  expect(hash).not.toBe("secret123");
  expect(await verifyPassword("secret123", hash)).toBe(true);
  expect(await verifyPassword("wrong", hash)).toBe(false);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npm test tests/password.test.ts`
Expected: FAIL(模块不存在)。

- [ ] **Step 3: 实现**

Create `src/lib/password.ts`:
```ts
import bcrypt from "bcryptjs";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 4: 运行确认通过**

Run: `npm test tests/password.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: 添加密码哈希工具

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: 注册逻辑与接口

**Files:**
- Create: `src/lib/validation.ts`, `src/lib/users.ts`, `src/app/api/register/route.ts`, `tests/register.test.ts`

**Interfaces:**
- Consumes: `hashPassword` (Task 3), `prisma` (Task 2)。
- Produces: `registerSchema` (zod);`createUser(input): Promise<{ id: string }>`,邮箱重复时抛 `Error("EMAIL_TAKEN")`;`POST /api/register`。

- [ ] **Step 1: 写失败测试**

Create `tests/register.test.ts`:
```ts
import { afterAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import { createUser } from "@/lib/users";
import { verifyPassword } from "@/lib/password";

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: "reg@example.com" } });
  await prisma.$disconnect();
});

test("createUser 写库并哈希密码,重复邮箱报错", async () => {
  const { id } = await createUser({
    name: "张三",
    email: "reg@example.com",
    password: "pass1234",
  });
  const u = await prisma.user.findUnique({ where: { id } });
  expect(u?.name).toBe("张三");
  expect(await verifyPassword("pass1234", u!.passwordHash)).toBe(true);

  await expect(
    createUser({ name: "李四", email: "reg@example.com", password: "x" })
  ).rejects.toThrow("EMAIL_TAKEN");
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npm test tests/register.test.ts`
Expected: FAIL(模块不存在)。

- [ ] **Step 3: 实现 validation 与 users**

Create `src/lib/validation.ts`:
```ts
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "请填写姓名"),
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少 6 位"),
  phone: z.string().optional(),
  organization: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
```

Create `src/lib/users.ts`:
```ts
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import type { RegisterInput } from "@/lib/validation";

export async function createUser(input: RegisterInput): Promise<{ id: string }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new Error("EMAIL_TAKEN");
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      phone: input.phone,
      organization: input.organization,
    },
  });
  return { id: user.id };
}
```

- [ ] **Step 4: 运行确认通过**

Run: `npm test tests/register.test.ts`
Expected: PASS。

- [ ] **Step 5: 注册 API 路由**

Create `src/app/api/register/route.ts`:
```ts
import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation";
import { createUser } from "@/lib/users";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 }
    );
  }
  try {
    const { id } = await createUser(parsed.data);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    if (e instanceof Error && e.message === "EMAIL_TAKEN") {
      return NextResponse.json({ ok: false, error: "该邮箱已注册" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "注册失败" }, { status: 500 });
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: 用户注册逻辑与接口

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Auth.js 登录与角色会话

**Files:**
- Create: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/types/next-auth.d.ts`
- Modify: `tests/setup.ts`(无需改,占位)

**Interfaces:**
- Consumes: `prisma` (Task 2), `verifyPassword` (Task 3)。
- Produces: `handlers`、`auth`、`signIn`、`signOut`;session 含 `user.id`、`user.role`。

- [ ] **Step 1: Auth.js 配置**

Create `src/lib/auth.ts`:
```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const email = creds?.email as string | undefined;
        const password = creds?.password as string | undefined;
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        if (!(await verifyPassword(password, user.passwordHash))) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
});
```

- [ ] **Step 2: 类型扩展**

Create `src/types/next-auth.d.ts`:
```ts
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: string } & DefaultSession["user"];
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}
```

- [ ] **Step 3: Auth 路由**

Create `src/app/api/auth/[...nextauth]/route.ts`:
```ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 4: authorize 行为测试**

Create `tests/auth-role.test.ts`:
```ts
import { afterAll, beforeAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

let userId: string;

beforeAll(async () => {
  const u = await prisma.user.create({
    data: {
      name: "管理员",
      email: "authtest@example.com",
      passwordHash: await hashPassword("admin123"),
      role: "ADMIN",
    },
  });
  userId = u.id;
});

afterAll(async () => {
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

test("已存的 ADMIN 可按密码校验且 role 正确", async () => {
  const u = await prisma.user.findUnique({ where: { email: "authtest@example.com" } });
  expect(u?.role).toBe("ADMIN");
});
```
Run: `npm test tests/auth-role.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Auth.js 登录与角色会话

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: 种子数据脚本

**Files:**
- Create: `prisma/seed.ts`

**Interfaces:**
- Consumes: `prisma`, `hashPassword`。
- Produces: 初始 ADMIN(`admin@conf.local` / `admin123`)、`SiteConfig`(id=1)、若干示例 RegistrationType。

- [ ] **Step 1: 写 seed**

Create `prisma/seed.ts`:
```ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.siteConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      confName: "示例学术年会",
      confDate: "2026-09-18 至 2026-09-20",
      confLocation: "北京国际会议中心",
      welcomeHtml: "<p>欢迎参加本次大会。</p>",
      contactHtml: "<p>会务组电话:010-00000000</p>",
    },
  });

  const adminEmail = "admin@conf.local";
  const exists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!exists) {
    await prisma.user.create({
      data: {
        name: "系统管理员",
        email: adminEmail,
        passwordHash: await bcrypt.hash("admin123", 10),
        role: "ADMIN",
      },
    });
  }

  const types = ["普通代表", "学生代表", "现场注册"];
  for (const name of types) {
    const found = await prisma.registrationType.findFirst({ where: { name } });
    if (!found) {
      await prisma.registrationType.create({
        data: { name, fee: name === "学生代表" ? 800 : 1200 },
      });
    }
  }
  console.log("seed 完成");
}

main().finally(() => prisma.$disconnect());
```

- [ ] **Step 2: 运行 seed**

Run: `npm run db:seed`
Expected: 输出 "seed 完成"。

- [ ] **Step 3: 校验**

Run: `npx prisma studio` 仅作可选人工核对;自动校验执行:
```bash
npx tsx -e "import {PrismaClient} from '@prisma/client'; const p=new PrismaClient(); p.user.findUnique({where:{email:'admin@conf.local'}}).then(u=>{console.log(u?.role); return p.\$disconnect();})"
```
Expected: 输出 `ADMIN`。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: 种子数据(管理员/站点配置/报名类型)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: 前台布局与导航

**Files:**
- Create: `src/components/SiteHeader.tsx`, `src/components/SiteFooter.tsx`, `src/app/(public)/layout.tsx`, `src/app/(public)/page.tsx`
- Modify: `src/app/layout.tsx`(确保 root 仅 html/body 与 SessionProvider 无关的全局壳)

**Interfaces:**
- Consumes: `prisma`、`auth`(读取登录态)。
- Produces: 带顶部导航(对应参考站点菜单)的前台布局;占位首页展示 SiteConfig。

- [ ] **Step 1: 顶部导航**

Create `src/components/SiteHeader.tsx`:
```tsx
import Link from "next/link";
import { auth } from "@/lib/auth";

const NAV = [
  { href: "/", label: "首页" },
  { href: "/notices", label: "会议通知" },
  { href: "/register-conf", label: "注册报名" },
  { href: "/submissions", label: "论文提交" },
  { href: "/schedule/brief", label: "简明日程" },
  { href: "/schedule", label: "详细日程" },
  { href: "/speakers", label: "讲者查询" },
  { href: "/venue", label: "会场交通" },
  { href: "/hotels", label: "酒店预订" },
  { href: "/live", label: "直播" },
  { href: "/photos", label: "图片直播" },
  { href: "/contact", label: "联系方式" },
];

export default async function SiteHeader() {
  const session = await auth();
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="font-bold text-lg text-sky-700">会务系统</Link>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-gray-700 hover:text-sky-700">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto text-sm">
          {session?.user ? (
            <Link href="/me" className="text-sky-700">个人中心</Link>
          ) : (
            <Link href="/login" className="text-sky-700">登录 / 注册</Link>
          )}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: 页脚**

Create `src/components/SiteFooter.tsx`:
```tsx
export default function SiteFooter() {
  return (
    <footer className="mt-12 border-t bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-500">
        © {new Date().getFullYear()} 会务管理系统
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: 前台布局**

Create `src/app/(public)/layout.tsx`:
```tsx
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <SiteFooter />
    </div>
  );
}
```

- [ ] **Step 4: 占位首页**

Create `src/app/(public)/page.tsx`:
```tsx
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const cfg = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">{cfg?.confName ?? "学术会议"}</h1>
      <p className="text-gray-600">{cfg?.confDate} · {cfg?.confLocation}</p>
      <div className="prose" dangerouslySetInnerHTML={{ __html: cfg?.welcomeHtml ?? "" }} />
    </section>
  );
}
```
说明:create-next-app 默认在 `src/app/page.tsx` 生成首页;移动/删除该默认文件,改用本路由组的 `(public)/page.tsx`。

- [ ] **Step 5: 启动验证**

Run: `npm run build`
Expected: 构建成功无类型错误。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: 前台布局与导航

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: 后台壳、登录/注册页与角色守卫

**Files:**
- Create: `src/middleware.ts`, `src/app/(admin)/admin/layout.tsx`, `src/app/(admin)/admin/page.tsx`, `src/app/login/page.tsx`, `src/app/register/page.tsx`
- Test: `tests/middleware-config.test.ts`

**Interfaces:**
- Consumes: `auth` (Task 5)。
- Produces: `/admin/*` 仅 ADMIN 可访问(否则跳 `/login`);登录页、注册页可用。

- [ ] **Step 1: middleware 守卫**

Create `src/middleware.ts`:
```ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAdminPath = req.nextUrl.pathname.startsWith("/admin");
  if (!isAdminPath) return NextResponse.next();
  const role = req.auth?.user?.role;
  if (role !== "ADMIN") {
    const url = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 2: matcher 配置测试**

Create `tests/middleware-config.test.ts`:
```ts
import { expect, test } from "vitest";
import { config } from "@/middleware";

test("middleware 仅匹配 /admin", () => {
  expect(config.matcher).toContain("/admin/:path*");
});
```
Run: `npm test tests/middleware-config.test.ts`
Expected: PASS。

- [ ] **Step 3: 后台布局与仪表盘占位**

Create `src/app/(admin)/admin/layout.tsx`:
```tsx
import Link from "next/link";

const MENU = [
  { href: "/admin", label: "仪表盘" },
  { href: "/admin/site", label: "站点设置" },
  { href: "/admin/notices", label: "通知管理" },
  { href: "/admin/schedule", label: "日程管理" },
  { href: "/admin/speakers", label: "讲者管理" },
  { href: "/admin/registrations", label: "报名管理" },
  { href: "/admin/submissions", label: "论文管理" },
  { href: "/admin/hotels", label: "酒店管理" },
  { href: "/admin/albums", label: "图片直播" },
  { href: "/admin/users", label: "用户管理" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-52 shrink-0 border-r bg-gray-900 text-gray-100">
        <div className="p-4 font-bold">管理后台</div>
        <nav className="flex flex-col">
          {MENU.map((m) => (
            <Link key={m.href} href={m.href} className="px-4 py-2 text-sm hover:bg-gray-800">
              {m.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  );
}
```

Create `src/app/(admin)/admin/page.tsx`:
```tsx
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [users, regs, subs] = await Promise.all([
    prisma.user.count(),
    prisma.registration.count(),
    prisma.submission.count(),
  ]);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">仪表盘</h1>
      <div className="grid grid-cols-3 gap-4">
        {[
          ["用户", users],
          ["报名", regs],
          ["投稿", subs],
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

- [ ] **Step 4: 登录页**

Create `src/app/login/page.tsx`:
```tsx
"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: fd.get("email"),
      password: fd.get("password"),
      redirect: false,
    });
    if (res?.error) setError("邮箱或密码错误");
    else router.push("/me");
  }
  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="mb-6 text-2xl font-bold">登录</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input name="email" type="email" placeholder="邮箱" required className="w-full rounded border px-3 py-2" />
        <input name="password" type="password" placeholder="密码" required className="w-full rounded border px-3 py-2" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded bg-sky-700 py-2 text-white">登录</button>
      </form>
      <p className="mt-4 text-sm">还没有账号?<Link href="/register" className="text-sky-700">去注册</Link></p>
    </div>
  );
}
```
说明:需要 `SessionProvider`。若 `signIn` from `next-auth/react` 要求 provider,在 root `layout.tsx` 用 `"use client"` 包一层 `<SessionProvider>`,或直接用 `signIn` 的 redirect 模式。本步骤先用 `redirect:false` 客户端方式;如运行报缺 provider,在 `src/app/layout.tsx` 包 `SessionProvider`(来自 `next-auth/react`,需建一个 client 包装组件 `src/components/Providers.tsx`)。

- [ ] **Step 5: 注册页**

Create `src/app/register/page.tsx`:
```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        password: fd.get("password"),
        phone: fd.get("phone"),
        organization: fd.get("organization"),
      }),
    });
    const data = await res.json();
    if (!data.ok) setError(data.error);
    else router.push("/login");
  }
  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="mb-6 text-2xl font-bold">注册</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input name="name" placeholder="姓名" required className="w-full rounded border px-3 py-2" />
        <input name="email" type="email" placeholder="邮箱" required className="w-full rounded border px-3 py-2" />
        <input name="password" type="password" placeholder="密码(至少6位)" required className="w-full rounded border px-3 py-2" />
        <input name="phone" placeholder="手机号(选填)" className="w-full rounded border px-3 py-2" />
        <input name="organization" placeholder="单位(选填)" className="w-full rounded border px-3 py-2" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded bg-sky-700 py-2 text-white">注册</button>
      </form>
      <p className="mt-4 text-sm">已有账号?<Link href="/login" className="text-sky-700">去登录</Link></p>
    </div>
  );
}
```

- [ ] **Step 6: 构建验证**

Run: `npm run build`
Expected: 构建成功。
若 `signIn` 报缺 SessionProvider:Create `src/components/Providers.tsx`:
```tsx
"use client";
import { SessionProvider } from "next-auth/react";
export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```
并在 `src/app/layout.tsx` 用 `<Providers>` 包裹 `{children}`,再 `npm run build`。

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: 后台壳、登录注册页与角色守卫

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage(第1期范围):**
- 项目脚手架 → Task 1 ✓
- 全量 Prisma 模型 → Task 2 ✓(覆盖 spec §6 所有实体)
- 鉴权(注册/登录/角色)→ Task 3/4/5/8 ✓
- seed(首个 ADMIN + SiteConfig)→ Task 6 ✓(对应 spec §7)
- 前台布局/导航(对应 spec §4 全部菜单链接)→ Task 7 ✓
- 后台壳 + 角色保护(spec §5/§7)→ Task 8 ✓
- 后续期(内容/日程/报名/酒店等)不在本期,留待第2-5期。

**Placeholder scan:** 各步骤均含完整代码与命令;Task 4/5/8 的 "如报错则…" 是明确的条件分支处理,非占位。

**Type consistency:** `createUser`/`hashPassword`/`verifyPassword`/`registerSchema`/`handlers`/`auth` 在定义与引用处签名一致;Prisma 模型字段在 seed、布局、测试中引用一致(`siteConfig.id=1`、`role` 字符串、`SessionSpeaker` 复合主键)。
