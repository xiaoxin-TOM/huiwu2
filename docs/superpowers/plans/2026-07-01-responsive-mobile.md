# 响应式移动适配 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给现有会务系统补响应式移动适配,使手机浏览器上前后台都能顺畅使用,同时桌面端(≥md)保持现状。

**Architecture:** mobile-first + Tailwind 断点(base 面向手机,`md:` 恢复桌面)。前台导航折叠为汉堡下拉、后台侧栏折叠为抽屉,各抽一个 `"use client"` 交互壳承载开合状态;页面主体仍是 Server Component。后台宽表格统一套横向滚动容器。新增最小 RTL(jsdom)组件测试覆盖两个交互壳的开合。

**Tech Stack:** Next.js 16、Tailwind CSS、Vitest(新增 jsdom + @testing-library/react 仅供组件测试)。

## Global Constraints

- 全部中文 UI 文案;不改业务逻辑、数据模型、API、鉴权。
- mobile-first:base 样式给手机,`md:`(≥768px)恢复/保留现桌面布局;桌面外观基本不变。
- 只用 Tailwind 既有断点(sm/md/lg),不引入 UI 依赖。
- 交互状态(菜单开合)用 `"use client"` 组件;页面主体尽量保持 Server Component。
- 汉堡按钮/菜单项/主要按钮点击区 ≥44px。
- 组件测试用 `// @vitest-environment jsdom` 单文件切换环境,不影响既有 node 环境测试。
- 提交信息中文,结尾 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`。
- 禁止提交 `.env`、`.env.test`、`*.db`、`public/uploads/*`、`.superpowers/`。
- 复用:`SiteHeader.tsx`(现为 async server component,读 session);`(admin)/admin/layout.tsx`(含 `MENU`);后台各 `admin/*/page.tsx` 列表页含 `<table>`。

## File Structure

- `src/components/MobileNav.tsx` — 创建。前台移动端汉堡下拉菜单(client)。
- `src/components/SiteHeader.tsx` — 修改。桌面横排 `hidden md:flex`,移动端挂 `MobileNav`。
- `src/components/AdminShell.tsx` — 创建。后台移动端抽屉壳(client),桌面端固定侧栏。
- `src/app/(admin)/admin/layout.tsx` — 修改。改为把 `MENU` 与 `children` 交给 `AdminShell`。
- 后台列表页(8 个)— 修改。`<table>` 外套 `<div className="overflow-x-auto">`。
- `src/app/layout.tsx` — 修改。显式导出 `viewport`。
- 前台若干页 — 修改。断点/点击区/图片微调(见 Task 3)。
- `tests/mobile-nav.test.tsx`、`tests/admin-shell.test.tsx` — 创建。
- `package.json` — 修改。devDeps 增 `jsdom`、`@testing-library/react`。

---

### Task 1: 前台导航汉堡菜单

**Files:**
- Create: `src/components/MobileNav.tsx`
- Modify: `src/components/SiteHeader.tsx`
- Create: `tests/mobile-nav.test.tsx`
- Modify: `package.json`(devDeps)

**Interfaces:**
- Produces:
  - `MobileNav`(client 默认导出):props `{ items: { href: string; label: string }[]; accountHref: string; accountLabel: string }`。仅在 `<md` 显示汉堡按钮;点击在 header 下方展开竖向下拉面板,含 `items` 全部项 + 账户入口;点项或再点按钮收起。

- [ ] **Step 1: 安装组件测试依赖**

Run:
```bash
npm install -D jsdom @testing-library/react
```
Expected: 安装成功(不改运行时依赖)。

- [ ] **Step 2: 写失败测试**

创建 `tests/mobile-nav.test.tsx`:

```tsx
// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

// 隔离 next/link 的路由依赖:测试里渲染成普通 <a>
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

import MobileNav from "@/components/MobileNav";

afterEach(cleanup);

const items = [
  { href: "/", label: "首页" },
  { href: "/notices", label: "会议通知" },
];

test("初始收起时不渲染菜单项", () => {
  render(<MobileNav items={items} accountHref="/login" accountLabel="登录 / 注册" />);
  expect(screen.queryByText("会议通知")).toBeNull();
});

test("点击汉堡按钮展开,再点收起", () => {
  render(<MobileNav items={items} accountHref="/login" accountLabel="登录 / 注册" />);
  const btn = screen.getByRole("button", { name: "菜单" });
  fireEvent.click(btn);
  expect(screen.getByText("会议通知")).toBeTruthy();
  expect(screen.getByText("登录 / 注册")).toBeTruthy();
  fireEvent.click(btn);
  expect(screen.queryByText("会议通知")).toBeNull();
});
```

- [ ] **Step 3: 运行测试,确认失败**

Run: `npm test -- tests/mobile-nav.test.tsx`
Expected: FAIL,无法解析 `@/components/MobileNav`。

- [ ] **Step 4: 实现 `src/components/MobileNav.tsx`**

```tsx
"use client";
import { useState } from "react";
import Link from "next/link";

type NavItem = { href: string; label: string };

export default function MobileNav({
  items,
  accountHref,
  accountLabel,
}: {
  items: NavItem[];
  accountHref: string;
  accountLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="菜单"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 items-center justify-center rounded text-gray-700 hover:bg-gray-100"
      >
        <span className="text-2xl leading-none">{open ? "✕" : "☰"}</span>
      </button>

      {open && (
        <nav className="absolute left-0 right-0 top-full z-20 flex flex-col border-b bg-white shadow-sm">
          {items.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={close}
              className="px-4 py-3 text-gray-700 hover:bg-gray-50"
            >
              {n.label}
            </Link>
          ))}
          <Link
            href={accountHref}
            onClick={close}
            className="border-t px-4 py-3 font-medium text-sky-700 hover:bg-gray-50"
          >
            {accountLabel}
          </Link>
        </nav>
      )}
    </div>
  );
}
```

- [ ] **Step 5: 运行测试,确认通过**

Run: `npm test -- tests/mobile-nav.test.tsx`
Expected: PASS(2 passing)。

- [ ] **Step 6: 改造 `src/components/SiteHeader.tsx`**

整文件替换为(桌面横排 `hidden md:flex`,移动端用 `MobileNav`;header 加 `relative` 供下拉定位):

```tsx
import Link from "next/link";
import { auth } from "@/lib/auth";
import MobileNav from "@/components/MobileNav";

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
  const accountHref = session?.user ? "/me" : "/login";
  const accountLabel = session?.user ? "个人中心" : "登录 / 注册";

  return (
    <header className="relative border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-x-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-sky-700">会务系统</Link>

        {/* 桌面导航 */}
        <nav className="hidden flex-wrap gap-x-4 gap-y-1 text-sm md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-gray-700 hover:text-sky-700">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden text-sm md:block">
          <Link href={accountHref} className="text-sky-700">{accountLabel}</Link>
        </div>

        {/* 移动端汉堡 */}
        <div className="ml-auto md:hidden">
          <MobileNav items={NAV} accountHref={accountHref} accountLabel={accountLabel} />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 7: 构建 + 全量测试**

Run: `npm run build && npm test`
Expected: 构建成功;测试全部 PASS(既有 59 + 新增 mobile-nav 2 = 61),输出干净。

- [ ] **Step 8: 提交**

```bash
git add src/components/MobileNav.tsx src/components/SiteHeader.tsx tests/mobile-nav.test.tsx package.json package-lock.json
git commit -m "feat: 前台移动端汉堡导航

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: 后台侧栏抽屉 + 宽表格横向滚动

**Files:**
- Create: `src/components/AdminShell.tsx`
- Modify: `src/app/(admin)/admin/layout.tsx`
- Modify(各套一层 `overflow-x-auto`):`src/app/(admin)/admin/registrations/page.tsx`、`.../submissions/page.tsx`、`.../bookings/page.tsx`、`.../users/page.tsx`、`.../notices/page.tsx`、`.../speakers/page.tsx`、`.../schedule/page.tsx`、`.../hotels/page.tsx`
- Create: `tests/admin-shell.test.tsx`

**Interfaces:**
- Produces:
  - `AdminShell`(client 默认导出):props `{ menu: { href: string; label: string }[]; children: React.ReactNode }`。`<md` 顶部显示汉堡条,点击侧栏抽屉滑出 + 遮罩;`md:` 以上固定侧栏常驻、无汉堡条。

- [ ] **Step 1: 写失败测试**

创建 `tests/admin-shell.test.tsx`:

```tsx
// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

import AdminShell from "@/components/AdminShell";

afterEach(cleanup);

const menu = [
  { href: "/admin", label: "仪表盘" },
  { href: "/admin/site", label: "站点设置" },
];

test("点击汉堡打开抽屉,点遮罩关闭", () => {
  render(
    <AdminShell menu={menu}>
      <div>内容区</div>
    </AdminShell>,
  );
  // 初始:遮罩不存在
  expect(screen.queryByTestId("admin-drawer-overlay")).toBeNull();
  // 打开
  fireEvent.click(screen.getByRole("button", { name: "打开菜单" }));
  expect(screen.getByTestId("admin-drawer-overlay")).toBeTruthy();
  // 点遮罩关闭
  fireEvent.click(screen.getByTestId("admin-drawer-overlay"));
  expect(screen.queryByTestId("admin-drawer-overlay")).toBeNull();
});
```

- [ ] **Step 2: 运行测试,确认失败**

Run: `npm test -- tests/admin-shell.test.tsx`
Expected: FAIL,无法解析 `@/components/AdminShell`。

- [ ] **Step 3: 实现 `src/components/AdminShell.tsx`**

```tsx
"use client";
import Link from "next/link";
import { useState } from "react";

type MenuItem = { href: string; label: string };

export default function AdminShell({
  menu,
  children,
}: {
  menu: MenuItem[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="flex min-h-screen">
      {/* 移动端顶部条 */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-12 items-center gap-2 border-b bg-gray-900 px-3 text-gray-100 md:hidden">
        <button
          type="button"
          aria-label="打开菜单"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded hover:bg-gray-800"
        >
          <span className="text-2xl leading-none">☰</span>
        </button>
        <span className="font-bold">管理后台</span>
      </div>

      {/* 遮罩(仅移动端打开时) */}
      {open && (
        <div
          data-testid="admin-drawer-overlay"
          onClick={close}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      {/* 侧栏:md+ 常驻;移动端为抽屉 */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-52 shrink-0 transform border-r bg-gray-900 text-gray-100 transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 font-bold">管理后台</div>
        <nav className="flex flex-col">
          {menu.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              onClick={close}
              className="px-4 py-2 text-sm hover:bg-gray-800"
            >
              {m.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* 内容区:移动端留出顶部条高度 */}
      <main className="flex-1 bg-gray-50 p-6 pt-16 md:pt-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: 运行测试,确认通过**

Run: `npm test -- tests/admin-shell.test.tsx`
Expected: PASS(1 passing)。

- [ ] **Step 5: 改造 `src/app/(admin)/admin/layout.tsx`**

整文件替换为(保留 `MENU`,交给 `AdminShell`):

```tsx
import AdminShell from "@/components/AdminShell";

const MENU = [
  { href: "/admin", label: "仪表盘" },
  { href: "/admin/site", label: "站点设置" },
  { href: "/admin/notices", label: "通知管理" },
  { href: "/admin/pages", label: "内容页" },
  { href: "/admin/schedule", label: "日程管理" },
  { href: "/admin/speakers", label: "讲者管理" },
  { href: "/admin/registrations", label: "报名管理" },
  { href: "/admin/submissions", label: "论文管理" },
  { href: "/admin/hotels", label: "酒店管理" },
  { href: "/admin/bookings", label: "预订管理" },
  { href: "/admin/albums", label: "图片直播" },
  { href: "/admin/users", label: "用户管理" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell menu={MENU}>{children}</AdminShell>;
}
```

注意:`MENU` 必须与现有 `layout.tsx` 中的项完全一致(顺序与 label 照抄现文件,勿增删)。

- [ ] **Step 6: 后台 8 个列表页表格套横向滚动**

对下列每个文件,把其 `<table ...>…</table>` 整段用 `<div className="overflow-x-auto">…</div>` 包起来(仅加外层容器,表格内容不动):
`src/app/(admin)/admin/registrations/page.tsx`、`submissions/page.tsx`、`bookings/page.tsx`、`users/page.tsx`、`notices/page.tsx`、`speakers/page.tsx`、`schedule/page.tsx`、`hotels/page.tsx`。

示例(以 registrations 为例,其余同理):

```tsx
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            {/* …原 thead/tbody 不变… */}
          </table>
        </div>
```

- [ ] **Step 7: 构建 + 全量测试**

Run: `npm run build && npm test`
Expected: 构建成功,后台路由齐全;测试全部 PASS(61 + admin-shell 1 = 62),输出干净。

- [ ] **Step 8: 提交**

```bash
git add src/components/AdminShell.tsx "src/app/(admin)/admin/layout.tsx" "src/app/(admin)/admin/registrations/page.tsx" "src/app/(admin)/admin/submissions/page.tsx" "src/app/(admin)/admin/bookings/page.tsx" "src/app/(admin)/admin/users/page.tsx" "src/app/(admin)/admin/notices/page.tsx" "src/app/(admin)/admin/speakers/page.tsx" "src/app/(admin)/admin/schedule/page.tsx" "src/app/(admin)/admin/hotels/page.tsx" tests/admin-shell.test.tsx
git commit -m "feat: 后台移动端侧栏抽屉与表格横向滚动

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: viewport + 全站断点视觉梳理

**Files:**
- Modify: `src/app/layout.tsx`(显式 `viewport`)
- Modify(按需微调):`src/app/(public)/page.tsx`(Hero 字号)及经视觉核对发现问题的前台页

**Interfaces:**
- Consumes: Task 1/2 的移动导航与后台壳。
- Produces:无新接口;交付为"三档尺寸下无横向溢出、可读、可点"的视觉结果。

- [ ] **Step 1: 显式导出 viewport**

在 `src/app/layout.tsx` 顶部 `import` 后、`metadata` 附近增加(`Metadata` 已导入,追加 `Viewport` 类型导入):

```tsx
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};
```

(保留现有 `metadata` 不变。)

- [ ] **Step 2: 首页 Hero 字号在手机上收敛**

在 `src/app/(public)/page.tsx` 把标题类改为响应式(手机略小、桌面同现状):

```tsx
      <h1 className="text-2xl font-bold sm:text-3xl">{cfg?.confName ?? "学术会议"}</h1>
```

- [ ] **Step 3: 逐页视觉核对(375 / 768 / 1024)**

用 Chrome DevTools 设备工具条,在 **375px、768px、1024px** 三档,逐页打开并核对下列**验收标准**;发现问题就地用 Tailwind 断点类修复(常见修法见下),每类问题的修复仅限样式类,不改结构与逻辑:

页面清单(前台):`/`、`/notices`、`/notices/[id]`、`/schedule/brief`、`/schedule`、`/speakers`、`/speakers/[id]`、`/venue`、`/contact`、`/register-conf`、`/submissions`、`/me`、`/hotels`、`/live`、`/photos`、`/photos/[id]`;(后台,登录管理员后)`/admin` 及各管理页。

验收标准(每页每档都要满足):
1. **无横向溢出**:页面不出现横向滚动条(表格区域除外,表格允许自身横向滚动)。
2. **导航可用**:前台 <md 显示汉堡且能展开/收起;后台 <md 显示顶部条+抽屉且能开关。
3. **可读**:正文不小于 14px(`text-sm`),标题不过大导致换行错乱。
4. **可点**:导航项、主要按钮点击区高度 ≥44px(≈ `min-h-11` 或 `py-3`)。
5. **栅格收敛**:多列 `grid` 在 375px 下不拥挤(酒店/讲者/相册/照片列表在窄屏为 1 列,`sm:` 起 2+ 列)。

常见修法(按需使用):
- 溢出:给外层加 `overflow-x-hidden` 或把宽死值改成 `max-w-full`;图片确保 `max-w-full`。
- 栅格:`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` 这类。
- 间距:容器 `px-4`、卡片 `p-4` 已够;标题 `text-2xl sm:text-3xl`。
- 点击区:小按钮加 `py-2`/`min-h-11`。

- [ ] **Step 4: 构建 + 全量测试**

Run: `npm run build && npm test`
Expected: 构建成功;测试全部 PASS(62,无回归),输出干净。

- [ ] **Step 5: 提交**

```bash
git add src/app/layout.tsx "src/app/(public)/page.tsx"
# 若视觉核对中改动了其它前台页,一并 git add 对应文件
git commit -m "feat: viewport 与全站移动端断点梳理

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review(计划编写者自检结果)

- **Spec 覆盖**:§3.1 前台导航→Task 1;§3.2 后台侧栏 + §3.3 宽表格→Task 2;§3.4 断点梳理 + §3.5 viewport→Task 3;§5 测试(交互壳组件测试 + 三档视觉验收)已分别落到 Task 1/2 的 RTL 测试与 Task 3 的验收清单。✅
- **占位符扫描**:Task 1/2 为完整代码;Task 3 的 viewport/Hero 有确定代码,视觉核对部分本质是"发现即修"的验收流程,已给出明确验收标准 + 常见修法,不是 TODO 占位。✅
- **类型/一致性**:`MobileNav` props(items/accountHref/accountLabel)在测试、组件、SiteHeader 三处一致;`AdminShell` props(menu/children)在测试、组件、layout 三处一致;`MENU` 要求照抄现文件。✅
- **测试环境**:新增 jsdom + @testing-library/react 仅作 devDep,组件测试用单文件 `// @vitest-environment jsdom`,不影响既有 node 环境用例;`next/link` 在测试中被 mock 成普通 `<a>`,规避路由上下文依赖。✅
- **已知取舍**:(1) 后台宽表格先用横向滚动保底,不做卡片式(YAGNI,spec 明确);(2) 组件测试只验开合状态(交互壳职责单一),视觉效果靠三档人工验收;(3) Task 3 属"视觉打磨",部分改动依赖实机观察,已用验收标准约束避免发散。
