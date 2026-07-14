# 活动内容页 + 富文本编辑器 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增活动简介/活动说明/活动须知三个会议内容页,并把全部内容页的编辑框升级为 Tiptap 富文本编辑器,HTML 全链路白名单过滤。

**Architecture:** 复用现有 Page 模型(meetingId+slug 唯一)与 AdminForm 提交流程;新增同构工具 `richtext.ts`(内容分流/纯文本转换)与服务端工具 `richtext-server.ts`(sanitize-html 白名单过滤);渲染端 `RichText` 按新旧内容双轨兼容。

**Tech Stack:** Next 16 App Router、React 19、Tiptap 3.27(@tiptap/react + @tiptap/starter-kit,内含 Link/Underline)、sanitize-html 2.17、vitest。

**设计文档:** `docs/superpowers/specs/2026-07-14-activity-pages-richtext-design.md`

## Global Constraints

- 本项目 Next 版本与常见文档不同,写页面/路由前查 `node_modules/next/dist/docs/`;现有代码模式优先。
- 服务端组件页面的 `searchParams` 是 `Promise<{ m?: string }>`,必须 `await`。
- `sanitize-html` 只能出现在服务端代码(`richtext-server.ts` 及其引用者),客户端组件只能引 `richtext.ts`。
- HTML 白名单:标签 `p br strong em u s h2 h3 ul ol li blockquote a`;属性仅 `a[href/target/rel]`;协议 `http/https/mailto`。
- 三个新 slug 及标题:`intro`=活动简介、`guide`=活动说明、`notice`=活动须知(注意与已有 `/notices` 会议通知区分)。
- 测试命令:`npx vitest run tests/richtext.test.ts`;全量 `npm test`(需本地 Postgres,`.env.test` 已指向 huiwu_test)。
- 提交信息用中文一句话,风格同现有历史(如"会场坐标与签到功能数据库变更脚本")。

---

### Task 1: 同构富文本工具(内容分流 + 纯文本转换)

**Files:**
- Create: `src/lib/richtext.ts`
- Test: `tests/richtext.test.ts`

**Interfaces:**
- Consumes: `escapeHtml(text: string): string`(已有,`src/lib/html.ts`,纯字符串操作无 Node 依赖)
- Produces: `isRichHtml(content: string): boolean`、`plainTextToHtml(text: string): string`(Task 3/4/5 使用)

- [ ] **Step 1: 写失败测试**

创建 `tests/richtext.test.ts`:

```ts
import { expect, test } from "vitest";
import { isRichHtml, plainTextToHtml } from "@/lib/richtext";

test("isRichHtml 识别 HTML 标签内容", () => {
  expect(isRichHtml("<p>你好</p>")).toBe(true);
  expect(isRichHtml("<ul><li>a</li></ul>")).toBe(true);
});

test("isRichHtml 对纯文本与数学符号返回 false", () => {
  expect(isRichHtml("第一行\n第二行")).toBe(false);
  expect(isRichHtml("a < b 且 c > d")).toBe(false);
  expect(isRichHtml("")).toBe(false);
});

test("plainTextToHtml 按行转段落并转义特殊字符", () => {
  expect(plainTextToHtml("第一行\n第二行")).toBe("<p>第一行</p><p>第二行</p>");
  expect(plainTextToHtml("a<b>c")).toBe("<p>a&lt;b&gt;c</p>");
  expect(plainTextToHtml("")).toBe("");
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/richtext.test.ts`
Expected: FAIL,`Cannot find module '@/lib/richtext'` 或同类报错

- [ ] **Step 3: 最小实现**

创建 `src/lib/richtext.ts`:

```ts
import { escapeHtml } from "@/lib/html";

/**
 * 判断内容是否为富文本 HTML(编辑器产出)。
 * 旧数据是管理员手打的纯文本,不含 <tag> 形式的标签;
 * "a < b" 这类比较符后无字母紧跟,不会误判。
 */
export function isRichHtml(content: string): boolean {
  return /<[a-z][a-z0-9]*(\s[^>]*)?>/i.test(content);
}

/** 旧纯文本喂给富文本编辑器前的转换:转义后按行拆成 <p> 段落。 */
export function plainTextToHtml(text: string): string {
  if (!text) return "";
  return text
    .split(/\r\n|\n|\r/)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}
```

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run tests/richtext.test.ts`
Expected: 3 passed

- [ ] **Step 5: 提交**

```bash
git add src/lib/richtext.ts tests/richtext.test.ts
git commit -m "富文本内容分流与纯文本转换工具"
```

---

### Task 2: 服务端 HTML 白名单过滤

**Files:**
- Create: `src/lib/richtext-server.ts`
- Modify: `package.json`(新依赖)
- Test: `tests/richtext.test.ts`(追加)

**Interfaces:**
- Produces: `sanitizeRichHtml(html: string): string`(Task 3/5 使用)

- [ ] **Step 1: 安装依赖**

```bash
npm install sanitize-html && npm install -D @types/sanitize-html
```

- [ ] **Step 2: 追加失败测试**

在 `tests/richtext.test.ts` 追加:

```ts
import { sanitizeRichHtml } from "@/lib/richtext-server";

test("sanitizeRichHtml 保留白名单标签", () => {
  const input = "<h2>标题</h2><p><strong>粗</strong><em>斜</em></p><ul><li>项</li></ul><blockquote>引</blockquote>";
  expect(sanitizeRichHtml(input)).toBe(input);
});

test("sanitizeRichHtml 剥除危险内容", () => {
  expect(sanitizeRichHtml('<p>x</p><script>alert(1)</script>')).toBe("<p>x</p>");
  expect(sanitizeRichHtml('<p onclick="x()">y</p>')).toBe("<p>y</p>");
  expect(sanitizeRichHtml('<div><span>文字保留</span></div>')).toBe("文字保留");
});

test("sanitizeRichHtml 链接只留安全协议并补 rel/target", () => {
  const out = sanitizeRichHtml('<a href="https://example.com">链接</a>');
  expect(out).toContain('href="https://example.com"');
  expect(out).toContain('rel="noopener noreferrer"');
  expect(out).toContain('target="_blank"');
  expect(sanitizeRichHtml('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript:");
});

test("sanitizeRichHtml 空串返回空串", () => {
  expect(sanitizeRichHtml("")).toBe("");
});
```

- [ ] **Step 3: 运行确认失败**

Run: `npx vitest run tests/richtext.test.ts`
Expected: 新增用例 FAIL(模块不存在)

- [ ] **Step 4: 实现**

创建 `src/lib/richtext-server.ts`:

```ts
import sanitizeHtml from "sanitize-html";

// 仅服务端使用(API 路由 / 服务端组件),客户端 bundle 不得引入本文件。
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "em", "u", "s", "h2", "h3", "ul", "ol", "li", "blockquote", "a"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
  },
};

/** 富文本 HTML 白名单过滤:保存与渲染两端共用的唯一过滤口径。 */
export function sanitizeRichHtml(html: string): string {
  if (!html) return "";
  return sanitizeHtml(html, OPTIONS);
}
```

- [ ] **Step 5: 运行确认通过**

Run: `npx vitest run tests/richtext.test.ts`
Expected: 7 passed

- [ ] **Step 6: 提交**

```bash
git add src/lib/richtext-server.ts tests/richtext.test.ts package.json package-lock.json
git commit -m "sanitize-html 白名单过滤富文本"
```

---

### Task 3: RichText 渲染双轨兼容

**Files:**
- Modify: `src/components/RichText.tsx`
- Test: `tests/richtext.test.ts`(追加)

**Interfaces:**
- Consumes: `isRichHtml`(Task 1)、`sanitizeRichHtml`(Task 2)、`safeHtml`(已有 `src/lib/html.ts`)
- Produces: `RichText({ html, className? })` 渲染行为不变的对外接口

- [ ] **Step 1: 追加失败测试**

`RichText` 是无状态服务端组件(纯函数返回 JSX),直接调用并断言 `dangerouslySetInnerHTML`。在 `tests/richtext.test.ts` 追加:

```ts
import RichText from "@/components/RichText";

function renderedHtml(html: string): string {
  const el = RichText({ html }) as { props: { dangerouslySetInnerHTML: { __html: string } } };
  return el.props.dangerouslySetInnerHTML.__html;
}

test("RichText 对旧纯文本维持转义+换行", () => {
  expect(renderedHtml("第一行\n<注意>")).toBe("第一行<br />&lt;注意&gt;");
});

test("RichText 对富文本走白名单过滤", () => {
  expect(renderedHtml("<p>x</p><script>bad()</script>")).toBe("<p>x</p>");
  expect(renderedHtml("<h2>标题</h2>")).toBe("<h2>标题</h2>");
});
```

注意:`"第一行\n<注意>"` 中 `<注意>` 不匹配 `[a-z]` 开头的标签,仍走纯文本路径——用例即验证此分流。

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/richtext.test.ts`
Expected: 新增 2 个用例中"富文本走白名单过滤" FAIL(现实现会把 `<p>` 转义)

- [ ] **Step 3: 修改 RichText**

`src/components/RichText.tsx` 全文替换为:

```tsx
import { safeHtml } from "@/lib/html";
import { isRichHtml } from "@/lib/richtext";
import { sanitizeRichHtml } from "@/lib/richtext-server";

/**
 * 内容渲染(仅服务端组件使用):
 * - 富文本 HTML(编辑器产出)→ 白名单过滤后渲染(渲染端再过滤一次,纵深防御);
 * - 存量纯文本 → 转义 + 换行转 <br>,显示与历史一致。
 */
export default function RichText({
  html,
  className = "prose max-w-none",
}: {
  html: string;
  className?: string;
}) {
  const rendered = isRichHtml(html) ? sanitizeRichHtml(html) : safeHtml(html);
  return <div className={className} dangerouslySetInnerHTML={{ __html: rendered }} />;
}
```

- [ ] **Step 4: 运行确认通过 + 确认无客户端引用**

Run: `npx vitest run tests/richtext.test.ts`
Expected: 9 passed

Run: `grep -rln "components/RichText" src | xargs grep -l '"use client"' ; echo exit=$?`
Expected: 无文件输出(exit=123),即没有客户端组件引用 RichText

- [ ] **Step 5: 提交**

```bash
git add src/components/RichText.tsx tests/richtext.test.ts
git commit -m "RichText 渲染富文本与旧纯文本双轨兼容"
```

---

### Task 4: Tiptap 富文本编辑器组件

**Files:**
- Create: `src/components/RichTextEditor.tsx`
- Modify: `package.json`(新依赖)

**Interfaces:**
- Consumes: `isRichHtml`、`plainTextToHtml`(Task 1)
- Produces: `<RichTextEditor name?="contentHtml" defaultValue="" />` 客户端组件,在 `<form>` 内以隐藏 input 提交 HTML(Task 5 使用)

- [ ] **Step 1: 安装依赖**

```bash
npm install @tiptap/react @tiptap/starter-kit
```

说明:Tiptap v3 的 starter-kit 已内含 Link、Underline 扩展,无需单独安装。

- [ ] **Step 2: 编写组件**

创建 `src/components/RichTextEditor.tsx`:

```tsx
"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";
import { isRichHtml, plainTextToHtml } from "@/lib/richtext";

/** 富文本编辑器:在 AdminForm(原生 FormData 提交)内以隐藏 input 携带 HTML。 */
export default function RichTextEditor({
  name = "contentHtml",
  defaultValue = "",
}: {
  name?: string;
  defaultValue?: string;
}) {
  const [html, setHtml] = useState(() =>
    isRichHtml(defaultValue) ? defaultValue : plainTextToHtml(defaultValue),
  );
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false },
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
    ],
    content: html,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose max-w-none min-h-[240px] px-3 py-2 focus:outline-none",
      },
    },
    onUpdate({ editor }) {
      setHtml(editor.isEmpty ? "" : editor.getHTML());
    },
  });

  return (
    <div className="rounded border">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}

function ToolbarButton({
  label,
  title,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded px-2 py-1 text-sm transition disabled:opacity-40 ${
        active ? "bg-sky-100 text-sky-700" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  function setLink() {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("链接地址(http/https):", prev ?? "https://");
    if (url === null) return;
    if (url === "" || url === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="flex flex-wrap gap-1 border-b bg-slate-50 px-2 py-1.5">
      <ToolbarButton label="B" title="加粗" active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()} />
      <ToolbarButton label="I" title="斜体" active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()} />
      <ToolbarButton label="S" title="删除线" active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()} />
      <ToolbarButton label="H2" title="大标题" active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
      <ToolbarButton label="H3" title="小标题" active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
      <ToolbarButton label="• 列表" title="无序列表" active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <ToolbarButton label="1. 列表" title="有序列表" active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      <ToolbarButton label="引用" title="引用" active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()} />
      <ToolbarButton label="链接" title="插入/编辑链接(留空取消)" active={editor.isActive("link")}
        onClick={setLink} />
      <span className="mx-1 w-px self-stretch bg-slate-200" />
      <ToolbarButton label="撤销" title="撤销" disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()} />
      <ToolbarButton label="重做" title="重做" disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()} />
    </div>
  );
}
```

注意事项:
- `immediatelyRender: false` 是 Next SSR 下避免水合不一致的官方要求。
- 工具栏按钮 `onMouseDown preventDefault` 防止点击时编辑器失焦。
- StarterKit v3 的 `link`/`codeBlock`/`code`/`horizontalRule` 配置键若与实际版本不符(TypeScript 会报错),以 `npx tsc --noEmit` 报错信息为准调整:v3 中关闭内置扩展用 `扩展名: false`,Link 配置键为 `link`。

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无输出(通过)。若 StarterKit 配置键报错,按上面注意事项修正后重跑。

- [ ] **Step 4: 提交**

```bash
git add src/components/RichTextEditor.tsx package.json package-lock.json
git commit -m "Tiptap 富文本编辑器组件"
```

---

### Task 5: 后台接入(内容页列表 + 编辑页 + API 过滤)

**Files:**
- Modify: `src/app/(admin)/admin/pages/page.tsx:6-9`(KNOWN 列表)
- Modify: `src/app/(admin)/admin/pages/[slug]/page.tsx`(KNOWN + 编辑器替换)
- Modify: `src/app/api/admin/pages/[slug]/route.ts`(写入前 sanitize)

**Interfaces:**
- Consumes: `RichTextEditor`(Task 4)、`sanitizeRichHtml`(Task 2)
- Produces: 后台五个内容页(intro/guide/notice/venue/contact)的编辑与保存链路

- [ ] **Step 1: 更新列表页 KNOWN**

`src/app/(admin)/admin/pages/page.tsx` 中:

```tsx
const KNOWN: { slug: string; label: string }[] = [
  { slug: "intro", label: "活动简介" },
  { slug: "guide", label: "活动说明" },
  { slug: "notice", label: "活动须知" },
  { slug: "venue", label: "会场交通" },
  { slug: "contact", label: "联系方式" },
];
```

同文件第 27 行描述文案改为:`编辑活动简介、活动说明、活动须知、会场交通、联系方式等富文本内容页。`

- [ ] **Step 2: 更新编辑页**

`src/app/(admin)/admin/pages/[slug]/page.tsx`:

顶部 import 增加:

```tsx
import RichTextEditor from "@/components/RichTextEditor";
```

KNOWN 改为:

```tsx
const KNOWN: Record<string, string> = {
  intro: "活动简介",
  guide: "活动说明",
  notice: "活动须知",
  venue: "会场交通",
  contact: "联系方式",
};
```

正文字段(原 `<label>正文(纯文本,换行自动分段)…textarea…</label>` 整块)替换为:

```tsx
<div className="block text-sm text-gray-600">
  正文
  <div className="mt-1">
    <RichTextEditor defaultValue={page?.contentHtml ?? ""} />
  </div>
</div>
```

- [ ] **Step 3: API 写入前过滤**

`src/app/api/admin/pages/[slug]/route.ts`:

顶部 import 增加:

```ts
import { sanitizeRichHtml } from "@/lib/richtext-server";
```

`parsePageForm` 中 `pageSchema.safeParse` 的入参改为:

```ts
const parsed = pageSchema.safeParse({
  title: form?.get("title") ?? "",
  contentHtml: sanitizeRichHtml(String(form?.get("contentHtml") ?? "")),
});
```

- [ ] **Step 4: 类型检查 + 全量测试**

Run: `npx tsc --noEmit && npm test`
Expected: 类型通过;测试全绿(31 文件 / 67+ 用例,含 tests/richtext.test.ts)

- [ ] **Step 5: 提交**

```bash
git add "src/app/(admin)/admin/pages/page.tsx" "src/app/(admin)/admin/pages/[slug]/page.tsx" "src/app/api/admin/pages/[slug]/route.ts"
git commit -m "后台内容页接入富文本编辑器并新增活动三页"
```

---

### Task 6: 前台三个页面 + 首页入口

**Files:**
- Create: `src/components/SimpleContentPage.tsx`
- Create: `src/app/(public)/intro/page.tsx`
- Create: `src/app/(public)/guide/page.tsx`
- Create: `src/app/(public)/notice/page.tsx`
- Modify: `src/components/icons.tsx`(新增 InfoIcon、BookOpenIcon)
- Modify: `src/app/(public)/page.tsx:20-28`(FEATURES 宫格)

**Interfaces:**
- Consumes: `requirePublicMeeting`/`guardPublicAccess`(`@/lib/public-guard`)、`getPage`(`@/lib/content`)、`RichText`、`PageHeader`、`SectionCard`
- Produces: 公共路由 `/intro`、`/guide`、`/notice`(经 proxy 也支持 `/m/<id>/intro` 等)

- [ ] **Step 1: 共享服务端组件**

创建 `src/components/SimpleContentPage.tsx`:

```tsx
import { getPage } from "@/lib/content";
import { requirePublicMeeting, guardPublicAccess } from "@/lib/public-guard";
import RichText from "@/components/RichText";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";

/** 纯内容展示页(活动简介/说明/须知等):按 slug 读取当前会议的内容页并渲染。 */
export default async function SimpleContentPage({
  slug,
  fallbackTitle,
  emptyText,
  m,
}: {
  slug: string;
  fallbackTitle: string;
  emptyText: string;
  m?: string;
}) {
  const meeting = await requirePublicMeeting(m);
  await guardPublicAccess(meeting.id);
  const page = await getPage(slug, meeting.id);
  return (
    <div className="space-y-4">
      <PageHeader title={page?.title ?? fallbackTitle} />
      <SectionCard>
        {page?.contentHtml ? (
          <div className="prose max-w-none text-slate-600">
            <RichText html={page.contentHtml} />
          </div>
        ) : (
          <p className="text-slate-500">{emptyText}</p>
        )}
      </SectionCard>
    </div>
  );
}
```

- [ ] **Step 2: 三个薄壳页面**

创建 `src/app/(public)/intro/page.tsx`:

```tsx
import SimpleContentPage from "@/components/SimpleContentPage";

export default async function IntroPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  return (
    <SimpleContentPage slug="intro" fallbackTitle="活动简介" emptyText="活动简介待发布。"
      m={(await searchParams).m} />
  );
}
```

创建 `src/app/(public)/guide/page.tsx`:

```tsx
import SimpleContentPage from "@/components/SimpleContentPage";

export default async function GuidePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  return (
    <SimpleContentPage slug="guide" fallbackTitle="活动说明" emptyText="活动说明待发布。"
      m={(await searchParams).m} />
  );
}
```

创建 `src/app/(public)/notice/page.tsx`:

```tsx
import SimpleContentPage from "@/components/SimpleContentPage";

export default async function NoticePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  return (
    <SimpleContentPage slug="notice" fallbackTitle="活动须知" emptyText="活动须知待发布。"
      m={(await searchParams).m} />
  );
}
```

- [ ] **Step 3: 新图标**

`src/components/icons.tsx` 末尾追加(沿用文件内 `baseIcon` 模式):

```tsx
export const InfoIcon = (props?: IconProps) =>
  baseIcon(
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </>,
    props,
  );

export const BookOpenIcon = (props?: IconProps) =>
  baseIcon(
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>,
    props,
  );
```

- [ ] **Step 4: 首页宫格入口**

`src/app/(public)/page.tsx` 的 FEATURES 中,在 `{ href: "/register-conf", … }` 之后、`{ href: "/notices", … }` 之前插入三项,并把 `InfoIcon, BookOpenIcon, AlertCircleIcon` 加进该文件已有的 icons import:

```tsx
  { href: "/intro", label: "活动简介", icon: InfoIcon },
  { href: "/guide", label: "活动说明", icon: BookOpenIcon },
  { href: "/notice", label: "活动须知", icon: AlertCircleIcon },
```

- [ ] **Step 5: 类型检查**

Run: `npx tsc --noEmit`
Expected: 通过

- [ ] **Step 6: 提交**

```bash
git add src/components/SimpleContentPage.tsx src/components/icons.tsx "src/app/(public)/intro" "src/app/(public)/guide" "src/app/(public)/notice" "src/app/(public)/page.tsx"
git commit -m "活动简介/说明/须知前台页面与首页入口"
```

---

### Task 7: 全量验证

**Files:** 无新增(验证)

- [ ] **Step 1: 静态检查与全量测试**

```bash
npx tsc --noEmit && npm run lint && npm test
```

Expected: 全部通过

- [ ] **Step 2: 端到端人工验证(dev server)**

```bash
npm run dev
```

按以下清单验证(用管理员账号,seed 默认账号见 `prisma/seed.ts`):

1. 后台 `/admin/pages`:列表出现 5 项(活动简介/活动说明/活动须知/会场交通/联系方式)。
2. 进入"活动简介"编辑:富文本工具栏可用,输入含加粗、H2、列表、链接的内容,保存成功。
3. 前台 `/intro`(或首页宫格点"活动简介"):内容按格式渲染,链接新窗口打开。
4. 编辑"会场交通"(存量纯文本):进编辑器自动成段,保存后前台 `/venue` 显示正常。
5. 未创建的"活动须知"前台 `/notice` 显示"活动须知待发布。"。
6. 在编辑器源头验证 XSS:通过 curl 直接 POST 带 `<script>` 的 contentHtml 到 `/api/admin/pages/intro`(带管理员 cookie),确认库中内容已被过滤(或用 psql 查 `Page` 表确认)。

- [ ] **Step 3: 收尾**

验证全部通过后,如有未提交的修正,按所属任务的提交风格补交。
