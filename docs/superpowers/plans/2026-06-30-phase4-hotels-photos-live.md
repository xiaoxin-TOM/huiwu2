# 阶段四:酒店 / 图片直播 / 直播 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 参会者可浏览酒店并在线提交预订申请、在个人中心查看预订状态;管理员在后台审核预订、创建相册并上传/删除照片;前台按相册浏览图片直播照片;"直播"页提供跳转到外部直播平台的链接。

**Architecture:** 沿用既有分层与第三期写路径范式:读用 Server Component 直连 Prisma/领域函数;写经 Route Handler(zod 校验 + `auth()`/`currentUser()` 校验登录态/角色,统一 `{ ok, error }`)。前台创建表单是 client component `fetch`;后台用原生 HTML `<form method="post">` 提交到受 `isAdmin` 守卫的 route handler 再 `303` 重定向。图片上传复用 `src/lib/upload.ts` 的落盘范式(新增 `validateImage`/`saveImage`)。业务逻辑抽到 `src/lib/*` 并以 Vitest + 测试库做 TDD。

**Tech Stack:** Next.js 16、Prisma 7、Auth.js v5、zod、Node `fs/promises`、Tailwind、Vitest。

## Global Constraints

- 单会议系统;全部中文 UI 文案。
- **直播 = 外链跳转**(用户决定,取代原 spec §4 #11 的 iframe 内嵌):前台 `/live` 读 `SiteConfig.liveUrl`,有值则渲染"进入直播"链接 `target="_blank" rel="noopener noreferrer"` 跳转外部平台,无值显示"直播暂未开始"。**不做 iframe 嵌入**。
- 写经 Route Handler;zod 校验;`{ ok:false, error }` 错误结构;落盘/入库失败包 try/catch 返回该结构(对齐第三期收尾)。
- 页面登录守卫用 `requireUser()`(`src/lib/session.ts`,已存在);API 用 `currentUser()` 返 401。
- `/admin/:path*` 页面由 middleware 守卫;**`/api/admin/*` 不在 matcher 内,每个 handler 必须自带 `isAdmin(session?.user?.role)` 守卫(403)**。
- 图片上传:仅 `image/jpeg|png|webp`,≤ 5 MB;存 `public/uploads/images/<uuid>.<ext>`(已被 `/public/uploads/` gitignore 覆盖),库存路径。
- 预订:`rooms ≥ 1`;离店日期须晚于入住日期(zod refine);酒店不存在抛 `HOTEL_NOT_FOUND` → 400。
- Next.js 16:动态路由 `params`、`RouteContext<'…'>.params` 为 `Promise`,必须 `await`。写 Next 代码前读 `node_modules/next/dist/docs/`。
- 测试用独立测试库(`.env.test` → test.db),自建并清理;外键:`HotelBooking.user`/`.hotel` 为 `Restrict`(清理先删 Booking 再删 User/Hotel),`Photo.album` 为 `Cascade`(删 Album 连带删 Photo)。状态枚举 `PENDING|APPROVED|REJECTED`。
- 提交信息中文,结尾 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`。
- 禁止提交 `.env`、`.env.test`、`*.db`、`public/uploads/*`、`.superpowers/`。
- 已复用:`prisma`、`auth`/`isAdmin`、`currentUser`/`requireUser`、`RichText`、`upload.ts`(`validatePdf`/`savePdf`)、`reviewSchema`(`{decision}`)、`(admin)` 布局(MENU 已含 `/admin/hotels`、`/admin/albums`)、`SiteHeader`(导航已含 `/hotels`、`/live`、`/photos`)。Prisma 模型 `Hotel`/`HotelBooking`/`Album`/`Photo`/`SiteConfig` 已建好。`/me` 个人中心(第三期)展示报名与投稿,本期加"我的酒店预订"段。

## File Structure

- `src/lib/upload.ts` — 修改。新增 `validateImage`、`saveImage`。
- `src/lib/validation.ts` — 修改。新增 `bookingSchema`、`albumSchema`、`photoCaptionSchema`(若需)。
- `src/lib/hotels.ts` — 创建。`listHotels`、`getHotel`。
- `src/lib/bookings.ts` — 创建。预订领域函数。
- `src/lib/albums.ts` — 创建。相册/照片领域函数。
- `src/app/api/bookings/route.ts` — 创建。POST 创建预订。
- `src/app/api/admin/bookings/[id]/route.ts` — 创建。POST 审核预订。
- `src/app/api/admin/albums/route.ts` — 创建。POST 创建相册。
- `src/app/api/admin/albums/[id]/photos/route.ts` — 创建。POST 上传照片(multipart)。
- `src/app/api/admin/photos/[id]/delete/route.ts` — 创建。POST 删除照片。
- `src/app/(public)/hotels/page.tsx` — 创建。酒店列表 + 预订表单。
- `src/components/BookingForm.tsx` — 创建。预订表单(client)。
- `src/app/(public)/me/page.tsx` — 修改。加"我的酒店预订"段。
- `src/app/(admin)/admin/bookings/page.tsx` — 创建。预订管理。
- `src/app/(admin)/admin/layout.tsx` — 修改。MENU 增加 `/admin/bookings`。
- `src/app/(admin)/admin/albums/page.tsx` — 创建。相册/照片管理。
- `src/app/(public)/photos/page.tsx` — 创建。相册列表。
- `src/app/(public)/photos/[id]/page.tsx` — 创建。相册照片浏览。
- `src/app/(public)/live/page.tsx` — 创建。直播外链页。
- `prisma/seed.ts` — 修改。新增酒店、相册+照片、SiteConfig.liveUrl。
- `tests/upload-image.test.ts`、`tests/bookings.test.ts`、`tests/albums.test.ts`、`tests/validation-booking.test.ts` — 创建。

---

### Task 1: 酒店与预订后端(领域 + 校验 + API + 种子)

**Files:**
- Create: `src/lib/hotels.ts`
- Create: `src/lib/bookings.ts`
- Modify: `src/lib/validation.ts`
- Create: `src/app/api/bookings/route.ts`
- Create: `tests/bookings.test.ts`
- Create: `tests/validation-booking.test.ts`
- Modify: `prisma/seed.ts`

**Interfaces:**
- Consumes: `prisma`、`currentUser`。
- Produces:
  - `bookingSchema`(`{ hotelId, checkIn, checkOut, rooms }`;`rooms` 用 `z.coerce.number().int().min(1)`;refine `checkOut > checkIn`)/ `BookingInput`。
  - `listHotels(): Promise<Hotel[]>`(按 price 升序)、`getHotel(id): Promise<Hotel | null>`。
  - `createBooking(userId, input: BookingInput): Promise<HotelBooking>` — 酒店不存在抛 `HOTEL_NOT_FOUND`。
  - `listUserBookings(userId): Promise<(HotelBooking & { hotel: Hotel })[]>`(createdAt 降序)。
  - `listBookings(): Promise<(HotelBooking & { user: User; hotel: Hotel })[]>`(createdAt 降序)。
  - `reviewBooking(id, decision: "APPROVED"|"REJECTED"): Promise<HotelBooking>`。

- [ ] **Step 1: 为 bookingSchema 写失败测试**

创建 `tests/validation-booking.test.ts`:

```ts
import { expect, test } from "vitest";
import { bookingSchema } from "@/lib/validation";

test("合法预订通过,rooms 字符串被强转为数字", () => {
  const r = bookingSchema.safeParse({
    hotelId: "h1", checkIn: "2026-09-18", checkOut: "2026-09-20", rooms: "2",
  });
  expect(r.success).toBe(true);
  if (r.success) expect(r.data.rooms).toBe(2);
});

test("离店不晚于入住时失败", () => {
  const r = bookingSchema.safeParse({
    hotelId: "h1", checkIn: "2026-09-20", checkOut: "2026-09-18", rooms: 1,
  });
  expect(r.success).toBe(false);
});

test("rooms < 1 失败", () => {
  expect(bookingSchema.safeParse({
    hotelId: "h1", checkIn: "2026-09-18", checkOut: "2026-09-20", rooms: 0,
  }).success).toBe(false);
});
```

- [ ] **Step 2: 运行测试,确认失败**

Run: `npm test -- tests/validation-booking.test.ts`
Expected: FAIL,无法从 `@/lib/validation` 解析 `bookingSchema`。

- [ ] **Step 3: 在 `src/lib/validation.ts` 追加 bookingSchema**

文件末尾追加:

```ts
export const bookingSchema = z
  .object({
    hotelId: z.string().min(1, "请选择酒店"),
    checkIn: z.string().min(1, "请选择入住日期"),
    checkOut: z.string().min(1, "请选择离店日期"),
    rooms: z.coerce.number().int().min(1, "房间数至少 1").max(10, "房间数过多"),
  })
  .refine((d) => d.checkOut > d.checkIn, {
    message: "离店日期需晚于入住日期",
    path: ["checkOut"],
  });
export type BookingInput = z.infer<typeof bookingSchema>;
```

- [ ] **Step 4: 运行测试,确认通过**

Run: `npm test -- tests/validation-booking.test.ts`
Expected: PASS(3 passing)。

- [ ] **Step 5: 实现 `src/lib/hotels.ts`**

```ts
import { prisma } from "@/lib/prisma";

export function listHotels() {
  return prisma.hotel.findMany({ orderBy: { price: "asc" } });
}

export function getHotel(id: string) {
  return prisma.hotel.findUnique({ where: { id } });
}
```

- [ ] **Step 6: 为预订领域函数写失败测试**

创建 `tests/bookings.test.ts`:

```ts
import { afterAll, beforeAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createBooking,
  listUserBookings,
  reviewBooking,
} from "@/lib/bookings";

let userId: string;
let hotelId: string;

beforeAll(async () => {
  const u = await prisma.user.create({
    data: { name: "预订测试", email: "booktest@example.com", passwordHash: "x" },
  });
  userId = u.id;
  const h = await prisma.hotel.create({ data: { name: "测试酒店", price: 500 } });
  hotelId = h.id;
});

afterAll(async () => {
  await prisma.hotelBooking.deleteMany({ where: { userId } });
  await prisma.hotel.delete({ where: { id: hotelId } }).catch(() => {});
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await prisma.$disconnect();
});

test("创建预订→列出用户预订→审核回显", async () => {
  const b = await createBooking(userId, {
    hotelId, checkIn: "2026-09-18", checkOut: "2026-09-20", rooms: 2,
  });
  expect(b.status).toBe("PENDING");
  expect(b.rooms).toBe(2);

  const list = await listUserBookings(userId);
  expect(list).toHaveLength(1);
  expect(list[0].hotel.name).toBe("测试酒店");

  const reviewed = await reviewBooking(b.id, "APPROVED");
  expect(reviewed.status).toBe("APPROVED");
});

test("酒店不存在抛 HOTEL_NOT_FOUND", async () => {
  await expect(
    createBooking(userId, {
      hotelId: "no-such-hotel", checkIn: "2026-09-18", checkOut: "2026-09-20", rooms: 1,
    }),
  ).rejects.toThrow("HOTEL_NOT_FOUND");
});
```

- [ ] **Step 7: 运行测试,确认失败**

Run: `npm test -- tests/bookings.test.ts`
Expected: FAIL,无法解析 `@/lib/bookings`。

- [ ] **Step 8: 实现 `src/lib/bookings.ts`**

```ts
import { prisma } from "@/lib/prisma";
import type { BookingInput } from "@/lib/validation";

export async function createBooking(userId: string, input: BookingInput) {
  const hotel = await prisma.hotel.findUnique({ where: { id: input.hotelId } });
  if (!hotel) throw new Error("HOTEL_NOT_FOUND");
  return prisma.hotelBooking.create({
    data: {
      userId,
      hotelId: input.hotelId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      rooms: input.rooms,
    },
  });
}

export function listUserBookings(userId: string) {
  return prisma.hotelBooking.findMany({
    where: { userId },
    include: { hotel: true },
    orderBy: { createdAt: "desc" },
  });
}

export function listBookings() {
  return prisma.hotelBooking.findMany({
    include: { user: true, hotel: true },
    orderBy: { createdAt: "desc" },
  });
}

export function reviewBooking(id: string, decision: "APPROVED" | "REJECTED") {
  return prisma.hotelBooking.update({ where: { id }, data: { status: decision } });
}
```

- [ ] **Step 9: 运行测试,确认通过**

Run: `npm test -- tests/bookings.test.ts`
Expected: PASS(2 passing)。

- [ ] **Step 10: 创建预订 API `src/app/api/bookings/route.ts`**

```ts
import { NextResponse } from "next/server";
import { bookingSchema } from "@/lib/validation";
import { currentUser } from "@/lib/session";
import { createBooking } from "@/lib/bookings";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }
  try {
    const b = await createBooking(user.id, parsed.data);
    return NextResponse.json({ ok: true, id: b.id });
  } catch (e) {
    if (e instanceof Error && e.message === "HOTEL_NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "酒店不存在" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "预订失败" }, { status: 500 });
  }
}
```

- [ ] **Step 11: seed 增加酒店**

在 `prisma/seed.ts` 追加(用 name 幂等):

```ts
  const hotels = [
    { name: "会议中心大酒店", price: 600, address: "会场旁 200 米", distance: "步行 3 分钟",
      description: "<p>紧邻主会场,含双早。</p>" },
    { name: "城市快捷酒店", price: 320, address: "地铁 8 号线奥体中心站", distance: "地铁 2 站",
      description: "<p>经济实惠,交通便利。</p>" },
  ];
  for (const h of hotels) {
    const found = await prisma.hotel.findFirst({ where: { name: h.name } });
    if (!found) await prisma.hotel.create({ data: h });
  }
```

- [ ] **Step 12: 运行 seed 与全量测试**

Run: `npm run db:seed && npm test`
Expected: seed 完成;全部 PASS(新增 validation-booking 3 + bookings 2)。

- [ ] **Step 13: 提交**

```bash
git add src/lib/hotels.ts src/lib/bookings.ts src/lib/validation.ts \
  src/app/api/bookings/route.ts tests/bookings.test.ts tests/validation-booking.test.ts prisma/seed.ts
git commit -m "feat: 酒店与预订后端(领域/校验/接口/种子)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: 酒店前台 + 个人中心预订段

**Files:**
- Create: `src/components/BookingForm.tsx`
- Create: `src/app/(public)/hotels/page.tsx`
- Modify: `src/app/(public)/me/page.tsx`

**Interfaces:**
- Consumes: `listHotels`、`requireUser`、`listUserBookings`、`RichText`。
- Produces: 前台 `/hotels`;`/me` 增"我的酒店预订"。

- [ ] **Step 1: 创建预订表单 client 组件 `src/components/BookingForm.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type HotelOption = { id: string; name: string; price: number };

export default function BookingForm({ hotels }: { hotels: HotelOption[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: fd.get("hotelId"),
          checkIn: fd.get("checkIn"),
          checkOut: fd.get("checkOut"),
          rooms: fd.get("rooms"),
        }),
      });
      const data = await res.json().catch(() => ({ ok: false, error: "服务器错误" }));
      if (!data.ok) {
        setError(data.error ?? "预订失败");
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
      <select name="hotelId" required className="w-full rounded border px-3 py-2">
        <option value="">请选择酒店</option>
        {hotels.map((h) => (
          <option key={h.id} value={h.id}>{h.name}(¥{h.price}/晚)</option>
        ))}
      </select>
      <label className="block text-sm text-gray-500">入住日期
        <input name="checkIn" type="date" required className="mt-1 w-full rounded border px-3 py-2" />
      </label>
      <label className="block text-sm text-gray-500">离店日期
        <input name="checkOut" type="date" required className="mt-1 w-full rounded border px-3 py-2" />
      </label>
      <input name="rooms" type="number" min={1} defaultValue={1} required
        className="w-full rounded border px-3 py-2" placeholder="房间数" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting}
        className="rounded bg-sky-700 px-4 py-2 text-white disabled:opacity-50">
        {submitting ? "提交中…" : "提交预订"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: 创建酒店页 `src/app/(public)/hotels/page.tsx`**

```tsx
import { listHotels } from "@/lib/hotels";
import RichText from "@/components/RichText";
import BookingForm from "@/components/BookingForm";

export default async function HotelsPage() {
  const hotels = await listHotels();
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">酒店预订</h1>

      {hotels.length === 0 ? (
        <p className="text-gray-500">暂无酒店信息。</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {hotels.map((h) => (
            <li key={h.id} className="space-y-2 rounded border p-4">
              {h.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={h.imageUrl} alt={h.name} className="h-40 w-full rounded object-cover" />
              )}
              <div className="flex items-baseline justify-between">
                <h2 className="font-medium">{h.name}</h2>
                <span className="text-sky-700">¥{h.price}/晚</span>
              </div>
              <p className="text-sm text-gray-500">{h.address} · {h.distance}</p>
              <RichText html={h.description} className="prose prose-sm max-w-none" />
            </li>
          ))}
        </ul>
      )}

      {hotels.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">提交预订申请</h2>
          <p className="text-sm text-gray-500">提交后可在个人中心查看审核状态(需登录)。</p>
          <BookingForm hotels={hotels.map((h) => ({ id: h.id, name: h.name, price: h.price }))} />
        </div>
      )}
    </section>
  );
}
```

(说明:预订接口已要求登录,未登录提交会收到"请先登录"错误并展示在表单上;此处不强制整页守卫,允许匿名浏览酒店。)

- [ ] **Step 3: `/me` 增加"我的酒店预订"段**

修改 `src/app/(public)/me/page.tsx`:导入 `listUserBookings`,在 `Promise.all` 中并行取预订,并在投稿段后新增一段。

将 import 区加上:

```tsx
import { listUserBookings } from "@/lib/bookings";
```

把 `Promise.all` 改为:

```tsx
  const [registration, submissions, bookings] = await Promise.all([
    getUserRegistration(user.id),
    listUserSubmissions(user.id),
    listUserBookings(user.id),
  ]);
```

在"我的投稿"段之后追加:

```tsx
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">我的酒店预订</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-gray-500">
            尚无预订。<a href="/hotels" className="text-sky-700 hover:underline">去预订</a>
          </p>
        ) : (
          <ul className="divide-y rounded border">
            {bookings.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="font-medium">{b.hotel.name}</span>
                <span className="text-gray-400">{b.checkIn} → {b.checkOut} · {b.rooms} 间</span>
                <span className="ml-auto text-sky-700">{STATUS_LABEL[b.status] ?? b.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
```

(复用页面已有的 `STATUS_LABEL`。)

- [ ] **Step 4: 构建 + 测试**

Run: `npm run build && npm test`
Expected: 构建成功,`/hotels` 出现;测试全 PASS(无新测试)。

- [ ] **Step 5: 提交**

```bash
git add src/components/BookingForm.tsx "src/app/(public)/hotels" "src/app/(public)/me/page.tsx"
git commit -m "feat: 酒店前台与个人中心预订

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: 后台预订管理

**Files:**
- Create: `src/app/api/admin/bookings/[id]/route.ts`
- Create: `src/app/(admin)/admin/bookings/page.tsx`
- Modify: `src/app/(admin)/admin/layout.tsx`

**Interfaces:**
- Consumes: `auth`、`isAdmin`、`reviewSchema`、`listBookings`、`reviewBooking`。
- Produces: 后台 `/admin/bookings`;审核 API。

- [ ] **Step 1: 创建预订审核 API `src/app/api/admin/bookings/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { reviewSchema } from "@/lib/validation";
import { reviewBooking } from "@/lib/bookings";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/bookings/[id]">) {
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
  try {
    await reviewBooking(id, parsed.data.decision);
  } catch {
    return NextResponse.json({ ok: false, error: "操作失败" }, { status: 400 });
  }
  return NextResponse.redirect(new URL("/admin/bookings", req.url), { status: 303 });
}
```

- [ ] **Step 2: 后台菜单增加入口**

修改 `src/app/(admin)/admin/layout.tsx`,在 `MENU` 数组中 `/admin/hotels` 之后插入一行:

```tsx
  { href: "/admin/bookings", label: "预订管理" },
```

- [ ] **Step 3: 创建预订管理页 `src/app/(admin)/admin/bookings/page.tsx`**

```tsx
import { listBookings } from "@/lib/bookings";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "未通过",
};

function ReviewButtons({ id }: { id: string }) {
  return (
    <div className="flex gap-2">
      <form action={`/api/admin/bookings/${id}`} method="post">
        <input type="hidden" name="decision" value="APPROVED" />
        <button type="submit" className="rounded bg-green-600 px-2 py-1 text-xs text-white">通过</button>
      </form>
      <form action={`/api/admin/bookings/${id}`} method="post">
        <input type="hidden" name="decision" value="REJECTED" />
        <button type="submit" className="rounded bg-red-600 px-2 py-1 text-xs text-white">拒绝</button>
      </form>
    </div>
  );
}

export default async function AdminBookingsPage() {
  const bookings = await listBookings();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">预订管理</h1>
      {bookings.length === 0 ? (
        <p className="text-gray-500">暂无预订。</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">预订人</th><th>酒店</th><th>入住</th><th>离店</th><th>房间</th><th>状态</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-b">
                <td className="py-2">{b.user.email}</td>
                <td>{b.hotel.name}</td>
                <td>{b.checkIn}</td>
                <td>{b.checkOut}</td>
                <td>{b.rooms}</td>
                <td className="text-sky-700">{STATUS_LABEL[b.status] ?? b.status}</td>
                <td><ReviewButtons id={b.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 构建 + 测试**

Run: `npm run build && npm test`
Expected: 构建成功,`/admin/bookings`、`/api/admin/bookings/[id]` 出现;测试全 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/app/api/admin/bookings "src/app/(admin)/admin/bookings" "src/app/(admin)/admin/layout.tsx"
git commit -m "feat: 后台预订管理与审核

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: 图片直播后端与管理(相册/照片 + 上传)

**Files:**
- Modify: `src/lib/upload.ts`
- Modify: `src/lib/validation.ts`
- Create: `src/lib/albums.ts`
- Create: `src/app/api/admin/albums/route.ts`
- Create: `src/app/api/admin/albums/[id]/photos/route.ts`
- Create: `src/app/api/admin/photos/[id]/delete/route.ts`
- Create: `src/app/(admin)/admin/albums/page.tsx`
- Create: `tests/upload-image.test.ts`
- Create: `tests/albums.test.ts`

**Interfaces:**
- Consumes: `prisma`、`auth`、`isAdmin`。
- Produces:
  - `validateImage(file: { type: string; size: number }): string | null`、`saveImage(file: File): Promise<string>`(存 `/uploads/images/<uuid>.<ext>`)。
  - `albumSchema`(`{ title, date }`)。
  - `listAlbums(): Promise<Album[]>`(date 降序)、`getAlbum(id): Promise<(Album & { photos: Photo[] }) | null>`(photos 按 createdAt 升序)、`createAlbum({title,date}): Promise<Album>`、`addPhoto(albumId, url, caption): Promise<Photo>`、`deletePhoto(id): Promise<Photo>`、`listAlbumsAdmin(): Promise<(Album & { photos: Photo[] })[]>`。

- [ ] **Step 1: 为 validateImage 写失败测试**

创建 `tests/upload-image.test.ts`:

```ts
import { expect, test } from "vitest";
import { validateImage } from "@/lib/upload";

test("接受 jpeg/png/webp", () => {
  expect(validateImage({ type: "image/jpeg", size: 1000 })).toBeNull();
  expect(validateImage({ type: "image/png", size: 1000 })).toBeNull();
  expect(validateImage({ type: "image/webp", size: 1000 })).toBeNull();
});

test("拒绝非图片类型", () => {
  expect(validateImage({ type: "application/pdf", size: 1000 })).toBe("仅支持 JPG/PNG/WebP 图片");
});

test("拒绝超过 5MB", () => {
  expect(validateImage({ type: "image/jpeg", size: 6 * 1024 * 1024 })).toBe("图片不能超过 5MB");
});
```

- [ ] **Step 2: 运行测试,确认失败**

Run: `npm test -- tests/upload-image.test.ts`
Expected: FAIL,无法解析 `validateImage`。

- [ ] **Step 3: 在 `src/lib/upload.ts` 追加图片支持**

在文件内(`savePdf` 之后)追加,并复用顶部已 import 的 `mkdir/writeFile/randomUUID/path`:

```ts
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateImage(file: { type: string; size: number }): string | null {
  if (!(file.type in IMAGE_EXT)) return "仅支持 JPG/PNG/WebP 图片";
  if (file.size > MAX_IMAGE_BYTES) return "图片不能超过 5MB";
  return null;
}

export async function saveImage(file: File): Promise<string> {
  const ext = IMAGE_EXT[file.type] ?? "bin";
  const dir = path.join(process.cwd(), "public", "uploads", "images");
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buf);
  return `/uploads/images/${name}`;
}
```

- [ ] **Step 4: 运行测试,确认通过**

Run: `npm test -- tests/upload-image.test.ts`
Expected: PASS(3 passing)。

- [ ] **Step 5: 为相册领域函数写失败测试**

创建 `tests/albums.test.ts`:

```ts
import { afterAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createAlbum,
  getAlbum,
  addPhoto,
  deletePhoto,
} from "@/lib/albums";

const albumIds: string[] = [];

afterAll(async () => {
  // Photo 对 Album 为 Cascade,删 Album 即连带删照片
  await prisma.album.deleteMany({ where: { id: { in: albumIds } } });
  await prisma.$disconnect();
});

test("建相册→加照片→读取→删照片", async () => {
  const album = await createAlbum({ title: "开幕式相册", date: "2026-09-18" });
  albumIds.push(album.id);

  const p1 = await addPhoto(album.id, "/uploads/images/a.jpg", "合影");
  await addPhoto(album.id, "/uploads/images/b.jpg", "");

  const full = await getAlbum(album.id);
  expect(full?.photos).toHaveLength(2);
  expect(full?.photos[0].caption).toBe("合影");

  await deletePhoto(p1.id);
  const after = await getAlbum(album.id);
  expect(after?.photos).toHaveLength(1);
});
```

- [ ] **Step 6: 运行测试,确认失败**

Run: `npm test -- tests/albums.test.ts`
Expected: FAIL,无法解析 `@/lib/albums`。

- [ ] **Step 7: 实现 `src/lib/albums.ts`**

```ts
import { prisma } from "@/lib/prisma";

export function listAlbums() {
  return prisma.album.findMany({ orderBy: { date: "desc" } });
}

export function listAlbumsAdmin() {
  return prisma.album.findMany({
    orderBy: { date: "desc" },
    include: { photos: { orderBy: { createdAt: "asc" } } },
  });
}

export function getAlbum(id: string) {
  return prisma.album.findUnique({
    where: { id },
    include: { photos: { orderBy: { createdAt: "asc" } } },
  });
}

export function createAlbum(data: { title: string; date: string }) {
  return prisma.album.create({ data });
}

export function addPhoto(albumId: string, url: string, caption: string) {
  return prisma.photo.create({ data: { albumId, url, caption } });
}

export function deletePhoto(id: string) {
  return prisma.photo.delete({ where: { id } });
}
```

- [ ] **Step 8: 运行测试,确认通过**

Run: `npm test -- tests/albums.test.ts`
Expected: PASS(1 passing)。

- [ ] **Step 9: 在 `src/lib/validation.ts` 追加 albumSchema**

```ts
export const albumSchema = z.object({
  title: z.string().min(1, "请填写相册标题"),
  date: z.string().min(1, "请填写日期"),
});
```

- [ ] **Step 10: 创建相册 API `src/app/api/admin/albums/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { albumSchema } from "@/lib/validation";
import { createAlbum } from "@/lib/albums";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const form = await req.formData().catch(() => null);
  const parsed = albumSchema.safeParse({ title: form?.get("title"), date: form?.get("date") });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }
  try {
    await createAlbum(parsed.data);
  } catch {
    return NextResponse.json({ ok: false, error: "创建失败" }, { status: 500 });
  }
  return NextResponse.redirect(new URL("/admin/albums", req.url), { status: 303 });
}
```

- [ ] **Step 11: 创建照片上传 API `src/app/api/admin/albums/[id]/photos/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { validateImage, saveImage } from "@/lib/upload";
import { addPhoto } from "@/lib/albums";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/albums/[id]/photos">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const caption = (form?.get("caption") as string) ?? "";
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "请选择图片" }, { status: 400 });
  }
  const err = validateImage({ type: file.type, size: file.size });
  if (err) return NextResponse.json({ ok: false, error: err }, { status: 400 });
  try {
    const url = await saveImage(file);
    await addPhoto(id, url, caption);
  } catch {
    return NextResponse.json({ ok: false, error: "上传失败" }, { status: 500 });
  }
  return NextResponse.redirect(new URL("/admin/albums", req.url), { status: 303 });
}
```

- [ ] **Step 12: 创建照片删除 API `src/app/api/admin/photos/[id]/delete/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { deletePhoto } from "@/lib/albums";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/photos/[id]/delete">) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    await deletePhoto(id);
  } catch {
    return NextResponse.json({ ok: false, error: "删除失败" }, { status: 400 });
  }
  return NextResponse.redirect(new URL("/admin/albums", req.url), { status: 303 });
}
```

- [ ] **Step 13: 创建相册管理页 `src/app/(admin)/admin/albums/page.tsx`**

```tsx
import { listAlbumsAdmin } from "@/lib/albums";

export default async function AdminAlbumsPage() {
  const albums = await listAlbumsAdmin();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">图片直播管理</h1>

      <form action="/api/admin/albums" method="post" className="flex flex-wrap items-end gap-2 rounded border p-4">
        <label className="text-sm text-gray-500">标题
          <input name="title" required className="mt-1 block rounded border px-3 py-1.5" />
        </label>
        <label className="text-sm text-gray-500">日期
          <input name="date" type="date" required className="mt-1 block rounded border px-3 py-1.5" />
        </label>
        <button type="submit" className="rounded bg-sky-700 px-3 py-1.5 text-sm text-white">新建相册</button>
      </form>

      {albums.length === 0 ? (
        <p className="text-gray-500">暂无相册。</p>
      ) : (
        albums.map((a) => (
          <div key={a.id} className="space-y-3 rounded border p-4">
            <div className="flex items-baseline gap-3">
              <h2 className="font-medium">{a.title}</h2>
              <span className="text-sm text-gray-400">{a.date}</span>
            </div>

            <form action={`/api/admin/albums/${a.id}/photos`} method="post"
              encType="multipart/form-data" className="flex flex-wrap items-center gap-2">
              <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required className="text-sm" />
              <input name="caption" placeholder="说明(可选)" className="rounded border px-2 py-1 text-sm" />
              <button type="submit" className="rounded bg-green-600 px-2 py-1 text-xs text-white">上传照片</button>
            </form>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {a.photos.map((p) => (
                <div key={p.id} className="space-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.caption} className="h-24 w-full rounded object-cover" />
                  <form action={`/api/admin/photos/${p.id}/delete`} method="post">
                    <button type="submit" className="w-full rounded bg-red-600 px-1 py-0.5 text-xs text-white">删除</button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 14: 构建 + 全量测试**

Run: `npm run build && npm test`
Expected: 构建成功,`/admin/albums`、三个 `/api/admin/...` 出现;测试全 PASS(新增 upload-image 3 + albums 1)。

- [ ] **Step 15: 提交**

```bash
git add src/lib/upload.ts src/lib/validation.ts src/lib/albums.ts \
  src/app/api/admin/albums src/app/api/admin/photos "src/app/(admin)/admin/albums" \
  tests/upload-image.test.ts tests/albums.test.ts
git commit -m "feat: 图片直播后端与后台管理(相册/照片上传)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: 图片直播前台 + 直播页

**Files:**
- Create: `src/app/(public)/photos/page.tsx`
- Create: `src/app/(public)/photos/[id]/page.tsx`
- Create: `src/app/(public)/live/page.tsx`
- Modify: `prisma/seed.ts`

**Interfaces:**
- Consumes: `listAlbums`、`getAlbum`、`prisma`(读 SiteConfig)。
- Produces: 前台 `/photos`、`/photos/[id]`、`/live`。

- [ ] **Step 1: 创建相册列表页 `src/app/(public)/photos/page.tsx`**

```tsx
import Link from "next/link";
import { listAlbums } from "@/lib/albums";

export default async function PhotosPage() {
  const albums = await listAlbums();
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">图片直播</h1>
      {albums.length === 0 ? (
        <p className="text-gray-500">暂无相册。</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-3">
          {albums.map((a) => (
            <li key={a.id} className="rounded border">
              <Link href={`/photos/${a.id}`} className="block">
                {a.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.coverUrl} alt={a.title} className="h-40 w-full rounded-t object-cover" />
                )}
                <div className="p-3">
                  <h2 className="font-medium text-sky-700">{a.title}</h2>
                  <p className="text-sm text-gray-400">{a.date}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 2: 创建相册照片页 `src/app/(public)/photos/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getAlbum } from "@/lib/albums";

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const album = await getAlbum(id);
  if (!album) notFound();
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{album.title}</h1>
      <p className="text-sm text-gray-400">{album.date}</p>
      {album.photos.length === 0 ? (
        <p className="text-gray-500">该相册暂无照片。</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {album.photos.map((p) => (
            <figure key={p.id} className="space-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.caption} className="w-full rounded object-cover" />
              {p.caption && <figcaption className="text-xs text-gray-500">{p.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: 创建直播页 `src/app/(public)/live/page.tsx`**

```tsx
import { prisma } from "@/lib/prisma";

export default async function LivePage() {
  const cfg = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  const liveUrl = cfg?.liveUrl;
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">直播</h1>
      {liveUrl ? (
        <div className="space-y-3">
          <p className="text-gray-600">点击下方按钮前往直播平台观看。</p>
          <a href={liveUrl} target="_blank" rel="noopener noreferrer"
            className="inline-block rounded bg-sky-700 px-5 py-2.5 text-white">
            进入直播 →
          </a>
        </div>
      ) : (
        <p className="text-gray-500">直播暂未开始,敬请期待。</p>
      )}
    </section>
  );
}
```

- [ ] **Step 4: seed 增加相册/照片与直播地址**

在 `prisma/seed.ts` 中:
1. 把 SiteConfig 的 `create` 块加上 `liveUrl`:在 `contactHtml` 行后加 `liveUrl: "https://www.bilibili.com/",`(示例外链)。
2. 末尾追加相册与照片(用 title 幂等):

```ts
  const albumTitle = "开幕式现场";
  let demoAlbum = await prisma.album.findFirst({ where: { title: albumTitle } });
  if (!demoAlbum) {
    demoAlbum = await prisma.album.create({
      data: { title: albumTitle, date: "2026-09-18", coverUrl: "/uploads/images/demo1.jpg" },
    });
    await prisma.photo.createMany({
      data: [
        { albumId: demoAlbum.id, url: "/uploads/images/demo1.jpg", caption: "嘉宾合影" },
        { albumId: demoAlbum.id, url: "/uploads/images/demo2.jpg", caption: "主会场" },
      ],
    });
  }
```

(说明:示例照片路径指向占位文件,真实图片由管理员后台上传;前台 `<img>` 对缺图会显示空白,不影响功能与构建。)

- [ ] **Step 5: 运行 seed、构建、全量测试**

Run: `npm run db:seed && npm run build && npm test`
Expected: seed 完成;构建成功,`/photos`、`/photos/[id]`、`/live` 出现;测试全 PASS。

- [ ] **Step 6: 提交**

```bash
git add "src/app/(public)/photos" "src/app/(public)/live" prisma/seed.ts
git commit -m "feat: 图片直播前台与直播外链页

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review(计划编写者自检结果)

- **Spec 覆盖**:对应 spec 第 9 节第四期"酒店 / 图片直播 / 直播":酒店列表+预订(Task 1/2)、个人中心预订(Task 2)、后台预订审核(Task 3)、相册+照片真做上传(Task 4 后台 + Task 5 前台)、直播(Task 5,按用户决定改外链跳转)。✅ 酒店增删改查(纯 admin CRUD)按分期留第五期。
- **占位符扫描**:无 TBD/TODO,每步含完整代码。✅
- **类型/签名一致性**:`bookingSchema`/`BookingInput`(Task 1)被 Task 2 表单与 API 一致使用;`validateImage`/`saveImage`(Task 4)被照片上传 API 复用;`reviewSchema` 复用第三期;`getAlbum`/`listAlbums`/`listAlbumsAdmin` 签名在 Task 4 定义、Task 5 消费一致;`RouteContext<'…'>` 路径串与目录一致。✅
- **测试策略**:领域层覆盖预订"创建→审核→回显 + 酒店不存在"、相册"建→加照片→读→删(含 Cascade)";`validateImage`/`bookingSchema`(含日期与房间数 refine)为纯函数测试。UI 与 route handler 由 `npm run build` + 领域测试间接保障;HTTP 级 `/api/admin/*` 越权测试仍如第三期延后(留第五期补)。⚠️ 已知取舍。
- **已知取舍**:(1) 直播改外链跳转,不内嵌(用户决定);(2) 图片仅按 `type`/`size` 校验,不验魔数(YAGNI,管理员可控);(3) 酒店纯 CRUD 留第五期,本期 seed 酒店;(4) 种子示例照片为占位路径,真实图片由后台上传;(5) `<img>` 用原生标签并显式禁用 `@next/next/no-img-element`(本地上传图片,不接入 next/image 优化)。
