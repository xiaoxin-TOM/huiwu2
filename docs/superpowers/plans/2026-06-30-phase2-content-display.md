# 阶段二:内容与展示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现前台的内容展示页面 —— 会议通知(列表/详情)、静态富文本页(会场交通/联系方式)、讲者查询(列表/搜索/详情)、日程(简明 + 详细),全部从数据库读取并由种子数据填充以便可视化验证。

**Architecture:** 读路径采用 Server Component 直连 Prisma。把"过滤 / 排序 / 分组 / 搜索"等真实逻辑抽到 `src/lib/*` 的纯函数或薄查询函数中并用 Vitest + 测试库做 TDD;页面组件只负责调用这些函数并渲染。富文本统一经 `RichText` 组件输出(集中未来的清洗点)。本阶段只做前台展示,内容的后台增删改在第五期完成,本期通过扩充 `prisma/seed.ts` 提供样例数据。

**Tech Stack:** Next.js 16(App Router,`params`/`searchParams` 均为 Promise 需 await)、TypeScript、Prisma 7(libsql adapter)、Tailwind、Vitest。

## Global Constraints

- 单会议系统;全部中文 UI 文案。
- Next.js 16:动态路由的 `params` 与页面的 `searchParams` 都是 `Promise`,必须 `await` 后再使用。写 Next.js 代码前先读 `node_modules/next/dist/docs/` 对应指南。
- 读操作:前台页面用 Server Component 直接 `import { prisma } from "@/lib/prisma"` 查询,不经 API。
- 数据库:开发与测试库分离(测试经 `tests/setup.ts` 加载 `.env.test`)。测试自建并清理自己的数据(参照 `tests/db.test.ts` 模式),不依赖 seed。
- 富文本字段(`welcomeHtml` / `contentHtml` / `Page.contentHtml`)是仅管理员可写的可信内容,统一用 `RichText` 组件渲染。
- 提交信息中文,并以 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` 结尾。
- 禁止提交 `.env`、`.env.test`、`*.db`、`.superpowers/` 下任何文件。
- Prisma 在 SQLite 上不支持 `mode: "insensitive"`;大小写不敏感搜索须在 JS 侧用纯函数实现并测试。
- 已存在可复用:`src/lib/prisma.ts`(`prisma` 单例)、`src/app/(public)/layout.tsx`(已套 `SiteHeader`/`SiteFooter`)、导航 `SiteHeader.tsx`(已含 `/notices` `/venue` `/contact` `/speakers` `/schedule` `/schedule/brief` 链接)。

## File Structure

- `src/components/RichText.tsx` — 创建。统一渲染可信 HTML 富文本的小组件。
- `src/lib/content.ts` — 创建。通知与静态页的查询函数(发布过滤、排序、按 slug 取页)。
- `src/lib/speakers.ts` — 创建。讲者查询与纯过滤函数 `filterSpeakers`。
- `src/lib/schedule.ts` — 创建。日程查询与纯分组函数 `groupByDayAndRoom`、简明过滤。
- `src/app/(public)/notices/page.tsx` — 创建。通知列表。
- `src/app/(public)/notices/[id]/page.tsx` — 创建。通知详情。
- `src/app/(public)/venue/page.tsx` — 创建。会场交通(Page slug=venue)。
- `src/app/(public)/contact/page.tsx` — 创建。联系方式(Page slug=contact)。
- `src/app/(public)/speakers/page.tsx` — 创建。讲者列表 + 搜索。
- `src/app/(public)/speakers/[id]/page.tsx` — 创建。讲者详情。
- `src/app/(public)/schedule/brief/page.tsx` — 创建。简明日程。
- `src/app/(public)/schedule/page.tsx` — 创建。详细日程(按天 / 会场分组)。
- `src/app/(public)/page.tsx` — 修改。首页致辞改用 `RichText`。
- `prisma/seed.ts` — 修改。新增 Notice / Page(venue, contact)/ Speaker / Session 样例数据。
- `tests/content.test.ts`、`tests/speakers.test.ts`、`tests/schedule.test.ts` — 创建。

---

### Task 1: RichText 组件 + 通知列表与详情

**Files:**
- Create: `src/components/RichText.tsx`
- Create: `src/lib/content.ts`
- Create: `src/app/(public)/notices/page.tsx`
- Create: `src/app/(public)/notices/[id]/page.tsx`
- Create: `tests/content.test.ts`
- Modify: `prisma/seed.ts`
- Modify: `src/app/(public)/page.tsx`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`。
- Produces:
  - `RichText({ html, className? }: { html: string; className?: string }): JSX.Element` — 默认外层 `className="prose max-w-none"`。
  - `getPublishedNotices(): Promise<Notice[]>` — 仅 `isPublished === true`,按 `publishedAt` 降序。
  - `getNoticeById(id: string): Promise<Notice | null>` — 仅返回已发布的;未发布或不存在返回 `null`。
  - (`Notice` 为 Prisma 生成类型 `import type { Notice } from "@prisma/client"`。)

- [ ] **Step 1: 为 content 查询函数写失败测试**

创建 `tests/content.test.ts`:

```ts
import { afterAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import { getPublishedNotices, getNoticeById } from "@/lib/content";

const ids: string[] = [];

afterAll(async () => {
  await prisma.notice.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

test("getPublishedNotices 只返回已发布并按时间降序", async () => {
  const older = await prisma.notice.create({
    data: { title: "旧通知", isPublished: true, publishedAt: new Date("2026-01-01") },
  });
  const newer = await prisma.notice.create({
    data: { title: "新通知", isPublished: true, publishedAt: new Date("2026-02-01") },
  });
  const hidden = await prisma.notice.create({
    data: { title: "未发布", isPublished: false },
  });
  ids.push(older.id, newer.id, hidden.id);

  const list = await getPublishedNotices();
  const titles = list.map((n) => n.title);
  expect(titles).not.toContain("未发布");
  expect(titles.indexOf("新通知")).toBeLessThan(titles.indexOf("旧通知"));
});

test("getNoticeById 对未发布或不存在返回 null", async () => {
  const hidden = await prisma.notice.create({ data: { title: "草稿", isPublished: false } });
  ids.push(hidden.id);
  expect(await getNoticeById(hidden.id)).toBeNull();
  expect(await getNoticeById("不存在的id")).toBeNull();
});
```

- [ ] **Step 2: 运行测试,确认失败**

Run: `npm test -- tests/content.test.ts`
Expected: FAIL,提示无法从 `@/lib/content` 解析 `getPublishedNotices`(模块不存在)。

- [ ] **Step 3: 实现 `src/lib/content.ts`**

```ts
import { prisma } from "@/lib/prisma";
import type { Notice, Page } from "@prisma/client";

export function getPublishedNotices(): Promise<Notice[]> {
  return prisma.notice.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getNoticeById(id: string): Promise<Notice | null> {
  const notice = await prisma.notice.findUnique({ where: { id } });
  if (!notice || !notice.isPublished) return null;
  return notice;
}

export function getPage(slug: string): Promise<Page | null> {
  return prisma.page.findUnique({ where: { slug } });
}
```

(`getPage` 供 Task 2 使用,此处一并定义。)

- [ ] **Step 4: 运行测试,确认通过**

Run: `npm test -- tests/content.test.ts`
Expected: PASS(2 passing)。

- [ ] **Step 5: 创建 `RichText` 组件**

`src/components/RichText.tsx`:

```tsx
export default function RichText({
  html,
  className = "prose max-w-none",
}: {
  html: string;
  className?: string;
}) {
  // 内容仅由管理员撰写,视为可信 HTML。
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
```

- [ ] **Step 6: 首页致辞改用 `RichText`**

修改 `src/app/(public)/page.tsx`,把致辞那行替换为 `RichText`:

```tsx
import { prisma } from "@/lib/prisma";
import RichText from "@/components/RichText";

export default async function HomePage() {
  const cfg = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">{cfg?.confName ?? "学术会议"}</h1>
      <p className="text-gray-600">{cfg?.confDate} · {cfg?.confLocation}</p>
      <RichText html={cfg?.welcomeHtml ?? ""} />
    </section>
  );
}
```

- [ ] **Step 7: 创建通知列表页**

`src/app/(public)/notices/page.tsx`:

```tsx
import Link from "next/link";
import { getPublishedNotices } from "@/lib/content";

export default async function NoticesPage() {
  const notices = await getPublishedNotices();
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">会议通知</h1>
      {notices.length === 0 ? (
        <p className="text-gray-500">暂无通知。</p>
      ) : (
        <ul className="divide-y">
          {notices.map((n) => (
            <li key={n.id} className="py-3">
              <Link href={`/notices/${n.id}`} className="text-sky-700 hover:underline">
                {n.title}
              </Link>
              <span className="ml-3 text-sm text-gray-400">
                {n.publishedAt.toISOString().slice(0, 10)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 8: 创建通知详情页**

`src/app/(public)/notices/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getNoticeById } from "@/lib/content";
import RichText from "@/components/RichText";

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notice = await getNoticeById(id);
  if (!notice) notFound();
  return (
    <article className="space-y-4">
      <h1 className="text-2xl font-bold">{notice.title}</h1>
      <p className="text-sm text-gray-400">
        {notice.publishedAt.toISOString().slice(0, 10)}
      </p>
      <RichText html={notice.contentHtml} />
    </article>
  );
}
```

- [ ] **Step 9: 扩充 seed 增加通知样例**

在 `prisma/seed.ts` 的 `main()` 内(`console.log` 之前)追加。先在文件已有逻辑后插入通知 upsert(用固定标题做幂等判断):

```ts
  const notices = [
    {
      title: "第一轮会议通知",
      contentHtml: "<p>欢迎参加示例学术年会,现将有关事项通知如下。</p>",
      isPublished: true,
    },
    {
      title: "论文征集启事",
      contentHtml: "<p>即日起开放摘要投稿,截止日期以官网为准。</p>",
      isPublished: true,
    },
    {
      title: "(草稿)日程调整",
      contentHtml: "<p>内部草稿,暂不发布。</p>",
      isPublished: false,
    },
  ];
  for (const n of notices) {
    const found = await prisma.notice.findFirst({ where: { title: n.title } });
    if (!found) await prisma.notice.create({ data: n });
  }
```

- [ ] **Step 10: 运行 seed 与全量测试**

Run: `npm run db:push && npm run db:seed && npm test`
Expected: seed 打印"seed 完成";测试全部 PASS(含既有 18 项 + 本任务新增)。

- [ ] **Step 11: 提交**

```bash
git add src/components/RichText.tsx src/lib/content.ts \
  "src/app/(public)/notices" "src/app/(public)/page.tsx" \
  tests/content.test.ts prisma/seed.ts
git commit -m "feat: 会议通知列表/详情与 RichText 组件

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: 静态富文本页(会场交通 / 联系方式)

**Files:**
- Modify: `src/lib/content.ts`(`getPage` 已在 Task 1 定义,本任务复用,不改)
- Create: `src/app/(public)/venue/page.tsx`
- Create: `src/app/(public)/contact/page.tsx`
- Modify: `tests/content.test.ts`(追加 `getPage` 测试)
- Modify: `prisma/seed.ts`

**Interfaces:**
- Consumes: `getPage(slug)` from `@/lib/content`(Task 1 已产出:`(slug: string) => Promise<Page | null>`)。
- Produces: 两个前台静态页路由 `/venue`、`/contact`(已在 `SiteHeader` 导航中)。

- [ ] **Step 1: 为 `getPage` 追加失败测试**

在 `tests/content.test.ts` 顶部 import 增加 `getPage`,并追加用例(同时把 `Page` 清理加进 `afterAll`):

```ts
// import 行改为:
// import { getPublishedNotices, getNoticeById, getPage } from "@/lib/content";

const pageSlugs: string[] = [];
// 在已有 afterAll 内补一行清理:
//   await prisma.page.deleteMany({ where: { slug: { in: pageSlugs } } });

test("getPage 命中返回页,缺失返回 null", async () => {
  await prisma.page.create({
    data: { slug: "venue-test", title: "交通测试", contentHtml: "<p>路线</p>" },
  });
  pageSlugs.push("venue-test");
  const page = await getPage("venue-test");
  expect(page?.title).toBe("交通测试");
  expect(await getPage("不存在")).toBeNull();
});
```

- [ ] **Step 2: 运行测试,确认新用例失败**

Run: `npm test -- tests/content.test.ts`
Expected: 既有用例 PASS;新用例此前会因 `getPage` 已实现而直接 PASS —— 若如此,确认断言确实覆盖"命中 + 缺失"两分支即可视为绿。
(说明:`getPage` 在 Task 1 一并实现,故本步骤主要补测试覆盖;若想严格 RED,可先临时把 import 改成不存在的名字确认失败再改回。)

- [ ] **Step 3: 创建会场交通页**

`src/app/(public)/venue/page.tsx`:

```tsx
import { getPage } from "@/lib/content";
import RichText from "@/components/RichText";

export default async function VenuePage() {
  const page = await getPage("venue");
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{page?.title ?? "会场交通"}</h1>
      {page ? (
        <RichText html={page.contentHtml} />
      ) : (
        <p className="text-gray-500">交通信息待发布。</p>
      )}
    </section>
  );
}
```

- [ ] **Step 4: 创建联系方式页**

`src/app/(public)/contact/page.tsx`:

```tsx
import { getPage } from "@/lib/content";
import RichText from "@/components/RichText";

export default async function ContactPage() {
  const page = await getPage("contact");
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{page?.title ?? "联系方式"}</h1>
      {page ? (
        <RichText html={page.contentHtml} />
      ) : (
        <p className="text-gray-500">联系方式待发布。</p>
      )}
    </section>
  );
}
```

- [ ] **Step 5: seed 增加 venue / contact 两个 Page**

在 `prisma/seed.ts` 追加:

```ts
  const pages = [
    {
      slug: "venue",
      title: "会场交通",
      contentHtml:
        "<p>会场:北京国际会议中心。地铁 8 号线奥体中心站 B 口步行 10 分钟。</p>",
    },
    {
      slug: "contact",
      title: "联系方式",
      contentHtml: "<p>会务组邮箱:office@conf.local<br/>电话:010-00000000</p>",
    },
  ];
  for (const p of pages) {
    await prisma.page.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }
```

- [ ] **Step 6: 运行 seed 与全量测试**

Run: `npm run db:seed && npm test`
Expected: PASS(content.test.ts 含 `getPage` 用例)。

- [ ] **Step 7: 提交**

```bash
git add "src/app/(public)/venue" "src/app/(public)/contact" \
  tests/content.test.ts prisma/seed.ts
git commit -m "feat: 会场交通与联系方式静态页

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: 讲者查询(列表 + 搜索 + 详情)

**Files:**
- Create: `src/lib/speakers.ts`
- Create: `src/app/(public)/speakers/page.tsx`
- Create: `src/app/(public)/speakers/[id]/page.tsx`
- Create: `tests/speakers.test.ts`
- Modify: `prisma/seed.ts`

**Interfaces:**
- Consumes: `prisma`、`RichText`。
- Produces:
  - `filterSpeakers(speakers: Speaker[], query: string): Speaker[]` — 纯函数;`query` 去空白后为空则原样返回;否则按 `name` 或 `organization` 大小写不敏感包含匹配。
  - `getAllSpeakers(): Promise<Speaker[]>` — 按 `name` 升序。
  - `getSpeakerById(id: string): Promise<Speaker | null>`。
  - (`Speaker` 为 `@prisma/client` 生成类型。)

- [ ] **Step 1: 为 `filterSpeakers` 写失败测试**

创建 `tests/speakers.test.ts`:

```ts
import { expect, test } from "vitest";
import { filterSpeakers } from "@/lib/speakers";
import type { Speaker } from "@prisma/client";

function spk(partial: Partial<Speaker>): Speaker {
  return {
    id: partial.id ?? "x",
    name: partial.name ?? "",
    title: partial.title ?? "",
    organization: partial.organization ?? "",
    bio: partial.bio ?? "",
    photoUrl: partial.photoUrl ?? null,
    isModerator: partial.isModerator ?? false,
  };
}

const list = [
  spk({ id: "1", name: "张三", organization: "清华大学" }),
  spk({ id: "2", name: "Li Si", organization: "Peking University" }),
  spk({ id: "3", name: "王五", organization: "北京大学" }),
];

test("空查询返回全部", () => {
  expect(filterSpeakers(list, "   ")).toHaveLength(3);
});

test("按姓名匹配", () => {
  expect(filterSpeakers(list, "张三").map((s) => s.id)).toEqual(["1"]);
});

test("按单位匹配且大小写不敏感", () => {
  expect(filterSpeakers(list, "peking").map((s) => s.id)).toEqual(["2"]);
});

test("按单位中文匹配", () => {
  expect(filterSpeakers(list, "北京大学").map((s) => s.id)).toEqual(["3"]);
});
```

- [ ] **Step 2: 运行测试,确认失败**

Run: `npm test -- tests/speakers.test.ts`
Expected: FAIL,无法解析 `filterSpeakers`。

- [ ] **Step 3: 实现 `src/lib/speakers.ts`**

```ts
import { prisma } from "@/lib/prisma";
import type { Speaker } from "@prisma/client";

export function filterSpeakers(speakers: Speaker[], query: string): Speaker[] {
  const q = query.trim().toLowerCase();
  if (!q) return speakers;
  return speakers.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.organization.toLowerCase().includes(q),
  );
}

export function getAllSpeakers(): Promise<Speaker[]> {
  return prisma.speaker.findMany({ orderBy: { name: "asc" } });
}

export function getSpeakerById(id: string): Promise<Speaker | null> {
  return prisma.speaker.findUnique({ where: { id } });
}
```

- [ ] **Step 4: 运行测试,确认通过**

Run: `npm test -- tests/speakers.test.ts`
Expected: PASS(4 passing)。

- [ ] **Step 5: 创建讲者列表 + 搜索页**

`src/app/(public)/speakers/page.tsx`(搜索用 GET 表单,读 `searchParams.q`):

```tsx
import Link from "next/link";
import { getAllSpeakers, filterSpeakers } from "@/lib/speakers";

export default async function SpeakersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const speakers = filterSpeakers(await getAllSpeakers(), q);
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">讲者查询</h1>
      <form className="flex gap-2" action="/speakers" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="按姓名或单位搜索"
          className="rounded border px-3 py-1.5 text-sm"
        />
        <button className="rounded bg-sky-700 px-3 py-1.5 text-sm text-white">
          搜索
        </button>
      </form>
      {speakers.length === 0 ? (
        <p className="text-gray-500">未找到匹配的讲者。</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {speakers.map((s) => (
            <li key={s.id} className="rounded border p-4">
              <Link href={`/speakers/${s.id}`} className="font-medium text-sky-700 hover:underline">
                {s.name}
              </Link>
              {s.isModerator && (
                <span className="ml-2 rounded bg-amber-100 px-1.5 text-xs text-amber-700">主持人</span>
              )}
              <p className="text-sm text-gray-500">{s.title} · {s.organization}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 6: 创建讲者详情页**

`src/app/(public)/speakers/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getSpeakerById } from "@/lib/speakers";
import RichText from "@/components/RichText";

export default async function SpeakerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const s = await getSpeakerById(id);
  if (!s) notFound();
  return (
    <article className="space-y-3">
      <h1 className="text-2xl font-bold">{s.name}</h1>
      <p className="text-gray-500">
        {s.title} · {s.organization}
        {s.isModerator && " · 主持人"}
      </p>
      <RichText html={s.bio} />
    </article>
  );
}
```

- [ ] **Step 7: seed 增加讲者**

在 `prisma/seed.ts` 追加(用 name 做幂等判断;Task 4 需要按 name 取 id 关联场次):

```ts
  const speakers = [
    { name: "张三", title: "教授", organization: "清华大学", bio: "<p>研究方向:人工智能。</p>" },
    { name: "李四", title: "研究员", organization: "北京大学", bio: "<p>研究方向:材料科学。</p>" },
    { name: "王五", title: "主任", organization: "中科院", bio: "<p>大会主持人。</p>", isModerator: true },
  ];
  for (const s of speakers) {
    const found = await prisma.speaker.findFirst({ where: { name: s.name } });
    if (!found) await prisma.speaker.create({ data: s });
  }
```

- [ ] **Step 8: 运行 seed 与全量测试**

Run: `npm run db:seed && npm test`
Expected: PASS。

- [ ] **Step 9: 提交**

```bash
git add src/lib/speakers.ts "src/app/(public)/speakers" \
  tests/speakers.test.ts prisma/seed.ts
git commit -m "feat: 讲者查询列表/搜索/详情

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: 日程(简明 + 详细)

**Files:**
- Create: `src/lib/schedule.ts`
- Create: `src/app/(public)/schedule/brief/page.tsx`
- Create: `src/app/(public)/schedule/page.tsx`
- Create: `tests/schedule.test.ts`
- Modify: `prisma/seed.ts`

**Interfaces:**
- Consumes: `prisma`、Task 3 seed 出的讲者(按 name 取 id 建立 `SessionSpeaker` 关联)。
- Produces:
  - 类型 `SessionWithSpeakers = Session & { speakers: (SessionSpeaker & { speaker: Speaker })[] }`。
  - `groupByDayAndRoom(sessions: SessionWithSpeakers[]): { day: string; rooms: { room: string; sessions: SessionWithSpeakers[] }[] }[]` — 纯函数。按 `day` 升序分组,组内按 `room` 升序再分组;每个 room 内按 `startTime` 升序。保持输入已排序时的稳定性。
  - `getDetailedSessions(): Promise<SessionWithSpeakers[]>` — 查询全部场次并 include speakers→speaker,按 `day`、`startTime` 升序。
  - `getBriefSessions(): Promise<SessionWithSpeakers[]>` — 同上但仅 `isBrief === true`。

- [ ] **Step 1: 为 `groupByDayAndRoom` 写失败测试**

创建 `tests/schedule.test.ts`:

```ts
import { expect, test } from "vitest";
import { groupByDayAndRoom, type SessionWithSpeakers } from "@/lib/schedule";

function sess(p: Partial<SessionWithSpeakers>): SessionWithSpeakers {
  return {
    id: p.id ?? "x",
    day: p.day ?? "2026-09-18",
    startTime: p.startTime ?? "09:00",
    endTime: p.endTime ?? "10:00",
    room: p.room ?? "主会场",
    title: p.title ?? "场次",
    isBrief: p.isBrief ?? false,
    speakers: p.speakers ?? [],
  };
}

test("按天分组,天内按会场分组,会场内按开始时间", () => {
  const input = [
    sess({ id: "d2", day: "2026-09-19", room: "A", startTime: "09:00" }),
    sess({ id: "d1b", day: "2026-09-18", room: "B", startTime: "11:00" }),
    sess({ id: "d1a-late", day: "2026-09-18", room: "A", startTime: "14:00" }),
    sess({ id: "d1a-early", day: "2026-09-18", room: "A", startTime: "09:00" }),
  ];
  const grouped = groupByDayAndRoom(input);

  expect(grouped.map((g) => g.day)).toEqual(["2026-09-18", "2026-09-19"]);

  const day1 = grouped[0];
  expect(day1.rooms.map((r) => r.room)).toEqual(["A", "B"]);
  expect(day1.rooms[0].sessions.map((s) => s.id)).toEqual(["d1a-early", "d1a-late"]);
});

test("空输入返回空数组", () => {
  expect(groupByDayAndRoom([])).toEqual([]);
});
```

- [ ] **Step 2: 运行测试,确认失败**

Run: `npm test -- tests/schedule.test.ts`
Expected: FAIL,无法解析 `groupByDayAndRoom`。

- [ ] **Step 3: 实现 `src/lib/schedule.ts`**

```ts
import { prisma } from "@/lib/prisma";
import type { Session, SessionSpeaker, Speaker } from "@prisma/client";

export type SessionWithSpeakers = Session & {
  speakers: (SessionSpeaker & { speaker: Speaker })[];
};

export type DayGroup = {
  day: string;
  rooms: { room: string; sessions: SessionWithSpeakers[] }[];
};

export function groupByDayAndRoom(sessions: SessionWithSpeakers[]): DayGroup[] {
  const sorted = [...sessions].sort(
    (a, b) =>
      a.day.localeCompare(b.day) ||
      a.room.localeCompare(b.room) ||
      a.startTime.localeCompare(b.startTime),
  );
  const days: DayGroup[] = [];
  for (const s of sorted) {
    let day = days.find((d) => d.day === s.day);
    if (!day) {
      day = { day: s.day, rooms: [] };
      days.push(day);
    }
    let room = day.rooms.find((r) => r.room === s.room);
    if (!room) {
      room = { room: s.room, sessions: [] };
      day.rooms.push(room);
    }
    room.sessions.push(s);
  }
  return days;
}

const include = { speakers: { include: { speaker: true } } } as const;

export function getDetailedSessions(): Promise<SessionWithSpeakers[]> {
  return prisma.session.findMany({
    include,
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  });
}

export function getBriefSessions(): Promise<SessionWithSpeakers[]> {
  return prisma.session.findMany({
    where: { isBrief: true },
    include,
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  });
}
```

- [ ] **Step 4: 运行测试,确认通过**

Run: `npm test -- tests/schedule.test.ts`
Expected: PASS(2 passing)。

- [ ] **Step 5: 创建简明日程页**

`src/app/(public)/schedule/brief/page.tsx`:

```tsx
import { getBriefSessions } from "@/lib/schedule";

export default async function BriefSchedulePage() {
  const sessions = await getBriefSessions();
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">简明日程</h1>
      {sessions.length === 0 ? (
        <p className="text-gray-500">日程待发布。</p>
      ) : (
        <ul className="divide-y">
          {sessions.map((s) => (
            <li key={s.id} className="flex gap-4 py-2 text-sm">
              <span className="w-44 shrink-0 text-gray-500">
                {s.day} {s.startTime}–{s.endTime}
              </span>
              <span className="font-medium">{s.title}</span>
              <span className="ml-auto text-gray-400">{s.room}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 6: 创建详细日程页**

`src/app/(public)/schedule/page.tsx`(讲者与主持人按 `role` 区分展示):

```tsx
import { getDetailedSessions, groupByDayAndRoom } from "@/lib/schedule";

export default async function SchedulePage() {
  const grouped = groupByDayAndRoom(await getDetailedSessions());
  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-bold">详细日程</h1>
      {grouped.length === 0 ? (
        <p className="text-gray-500">日程待发布。</p>
      ) : (
        grouped.map((day) => (
          <div key={day.day} className="space-y-4">
            <h2 className="text-lg font-semibold text-sky-700">{day.day}</h2>
            {day.rooms.map((room) => (
              <div key={room.room} className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">{room.room}</h3>
                <ul className="divide-y rounded border">
                  {room.sessions.map((s) => {
                    const speakers = s.speakers
                      .filter((x) => x.role === "SPEAKER")
                      .map((x) => x.speaker.name);
                    const moderators = s.speakers
                      .filter((x) => x.role === "MODERATOR")
                      .map((x) => x.speaker.name);
                    return (
                      <li key={s.id} className="space-y-1 px-3 py-2">
                        <div className="flex gap-3 text-sm">
                          <span className="w-28 shrink-0 text-gray-500">
                            {s.startTime}–{s.endTime}
                          </span>
                          <span className="font-medium">{s.title}</span>
                        </div>
                        {speakers.length > 0 && (
                          <p className="pl-28 text-xs text-gray-500">讲者:{speakers.join("、")}</p>
                        )}
                        {moderators.length > 0 && (
                          <p className="pl-28 text-xs text-gray-500">主持:{moderators.join("、")}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ))
      )}
    </section>
  );
}
```

- [ ] **Step 7: seed 增加场次并关联讲者**

在 `prisma/seed.ts` 追加(放在讲者 seed 之后,确保讲者已存在;用 title 幂等):

```ts
  const zhang = await prisma.speaker.findFirst({ where: { name: "张三" } });
  const li = await prisma.speaker.findFirst({ where: { name: "李四" } });
  const wang = await prisma.speaker.findFirst({ where: { name: "王五" } });

  const sessions = [
    {
      day: "2026-09-18", startTime: "09:00", endTime: "09:30",
      room: "主会场", title: "开幕式", isBrief: true,
      links: wang ? [{ speakerId: wang.id, role: "MODERATOR" }] : [],
    },
    {
      day: "2026-09-18", startTime: "09:30", endTime: "10:30",
      room: "主会场", title: "主旨报告:人工智能前沿", isBrief: true,
      links: zhang ? [{ speakerId: zhang.id, role: "SPEAKER" }] : [],
    },
    {
      day: "2026-09-19", startTime: "14:00", endTime: "15:00",
      room: "分会场 A", title: "材料科学分论坛", isBrief: false,
      links: li ? [{ speakerId: li.id, role: "SPEAKER" }] : [],
    },
  ];
  for (const s of sessions) {
    const found = await prisma.session.findFirst({ where: { title: s.title } });
    if (!found) {
      const { links, ...data } = s;
      await prisma.session.create({
        data: { ...data, speakers: { create: links } },
      });
    }
  }
```

- [ ] **Step 8: 运行 seed 与全量测试**

Run: `npm run db:seed && npm test`
Expected: seed 完成;全部测试 PASS。

- [ ] **Step 9: 启动 dev 做一次人工冒烟(可选但建议)**

Run: `npm run build`
Expected: 构建成功,无类型错误(确认所有新页面在 Next 16 下类型正确,尤其 `params`/`searchParams` 的 Promise 处理)。

- [ ] **Step 10: 提交**

```bash
git add src/lib/schedule.ts "src/app/(public)/schedule" \
  tests/schedule.test.ts prisma/seed.ts
git commit -m "feat: 简明与详细日程展示

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review(计划编写者自检结果)

- **Spec 覆盖**:本期对应 spec 第 9 节第二期"内容与展示":致辞(Task 1 首页)、通知(Task 1)、交通/联系(Task 2)、讲者查询(Task 3)、简明+详细日程(Task 4)。报名/投稿/个人中心属第三期,不在本期。✅
- **占位符扫描**:无 TBD/TODO,每个代码步骤含完整代码。✅
- **类型一致性**:`getPage` 在 Task 1 定义、Task 2 复用;`SessionWithSpeakers` 在 Task 4 定义并贯穿测试与页面;`filterSpeakers` 签名在测试与实现一致。✅
- **已知取舍**:(1) SQLite 无 `mode:insensitive`,讲者搜索改为取全量后 JS 纯函数过滤,数据量小可接受,且便于 TDD。(2) 富文本用 `dangerouslySetInnerHTML`,内容仅管理员可写视为可信,集中在 `RichText` 便于将来加清洗。(3) Task 2 的 `getPage` 已在 Task 1 实现,故其测试以补覆盖为主,已在步骤中说明如何获得 RED。
```
