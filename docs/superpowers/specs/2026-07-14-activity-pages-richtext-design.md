# 活动简介/说明/须知内容页 + 富文本编辑器 — 设计文档

日期:2026-07-14

## 目标

1. 新增三个会议内容页:活动简介、活动说明、活动须知,前台各有独立页面与首页入口。
2. 后台内容页编辑从纯文本 textarea 升级为富文本编辑器(基础排版:加粗、斜体、标题、列表、引用、链接),统一应用于全部五个内容页(新三页 + 会场交通 + 联系方式)。
3. 富文本 HTML 全链路做白名单过滤,防 XSS;存量纯文本内容不迁移、渲染不变。

## 方案选型

- **编辑器采用 Tiptap**(`@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/extension-link`):headless,工具栏自绘可贴合现有后台风格,兼容 React 19,活跃维护。
- 不采用 Quill 2:自带皮肤与现有风格不符,React 包装层对 React 19 兼容不佳。
- 不采用自研 contenteditable:底层 `document.execCommand` 已废弃,跨浏览器行为不可控。
- **HTML 过滤采用 `sanitize-html`**(服务端,Node 环境),白名单见下文。

## 数据模型

无 schema 变更。复用现有 `Page` 模型(`@@unique([meetingId, slug])`),新增三个约定 slug:

| slug | 页面 | 前台路由 |
|------|------|----------|
| `intro` | 活动简介 | `/intro` |
| `guide` | 活动说明 | `/guide` |
| `notice` | 活动须知 | `/notice` |

注意 `/notice`(活动须知)与已有 `/notices`(会议通知)是两个不同页面,后台列表中以中文标签区分。

## 富文本工具函数(两个新文件,按运行环境拆分)

**`src/lib/richtext.ts`(同构,客户端/服务端均可引用,零依赖):**

- `isRichHtml(content: string): boolean` — 判断内容是否为富文本 HTML(正则检测形如 `<p>`、`</ul>` 的标签),用于新旧内容分流
- `plainTextToHtml(text: string): string` — 旧纯文本喂给编辑器前的转换:转义 HTML 特殊字符后按换行拆成 `<p>` 段落

**`src/lib/richtext-server.ts`(仅服务端引用):**

- `sanitizeRichHtml(html: string): string` — 用 `sanitize-html` 过滤,白名单:
  - 标签:`p` `br` `strong` `em` `u` `s` `h2` `h3` `ul` `ol` `li` `blockquote` `a`
  - 属性:仅 `a[href]`;协议仅 `http` / `https` / `mailto`;为 `a` 强制补 `rel="noopener noreferrer"` 与 `target="_blank"`
  - 其余标签剥壳保留文本,`script`/`style` 整体丢弃

`sanitize-html` 依赖 Node API,通过文件拆分保证客户端 bundle 不含它;编辑器组件只引用 `richtext.ts`。

## 渲染(改 `src/components/RichText.tsx`)

- `isRichHtml(html)` 为真 → `sanitizeRichHtml(html)` 后渲染(渲染端再过滤一次,纵深防御,不信任库内已有数据);
- 为假(存量纯文本)→ 维持现状 `safeHtml`(转义 + 换行转 `<br>`),旧内容显示不变。

`RichText` 目前在服务端组件中使用,可直接调用 `sanitize-html`;保持该约束(不加 `"use client"`)。

## 编辑器组件(新文件 `src/components/RichTextEditor.tsx`)

- `"use client"`;props:`name`(表单字段名,默认 `contentHtml`)、`defaultValue`(库中原始内容)。
- 初始化:`isRichHtml(defaultValue)` 为真直接作为编辑器内容;为假先 `plainTextToHtml` 转换(两者来自同构的 `richtext.ts`)。
- 工具栏按钮:加粗、斜体、删除线、标题 H2/H3、无序列表、有序列表、引用、插入/取消链接(`window.prompt` 输入 URL)、撤销、重做;激活态高亮,风格与后台现有按钮一致(sky 色系、圆角、text-sm)。
- 编辑区最小高度约 240px,`prose` 样式使所见与前台渲染一致。
- 同步机制:渲染 `<input type="hidden" name={name}>`,Tiptap `onUpdate` 时把 `editor.getHTML()` 写入,兼容现有 `AdminForm` 提交流程;空内容(仅 `<p></p>`)提交空字符串。

## 后台

- `admin/pages/page.tsx`:`KNOWN` 列表增加三项(活动简介/活动说明/活动须知),排序:简介、说明、须知、会场交通、联系方式。
- `admin/pages/[slug]/page.tsx`:`KNOWN` 同步增加;正文字段由 textarea 换为 `<RichTextEditor defaultValue={page?.contentHtml ?? ""} />`,标签文案改为"正文"。
- `/api/admin/pages/[slug]/route.ts`:写库前对 `contentHtml` 执行 `sanitizeRichHtml`(唯一写入口,双保险之一)。

## 前台

- 三个新页面 `src/app/(public)/intro/page.tsx`、`guide/page.tsx`、`notice/page.tsx`,结构与 `/contact` 一致:`requirePublicMeeting` + `guardPublicAccess` + `getPage(slug, meeting.id)` + `PageHeader` + `SectionCard` + `RichText`;未创建时显示"内容待发布"。三页结构相同,抽一个共享服务端组件 `SimpleContentPage`(props:slug、默认标题、占位文案),三个 page 文件只是薄壳。
- 首页 `FEATURES` 宫格增加三项入口(活动简介/活动说明/活动须知),图标从现有 `icons.tsx` 选用或补充,置于"注册报名"之后、"会议通知"之前。

## 错误处理

- 编辑器仅在后台使用,加载失败不影响前台。
- `sanitizeRichHtml` 对空串/异常输入返回空串,不抛异常。
- 链接输入非法协议(如 `javascript:`)在 sanitize 阶段被剥除。

## 测试

新增 `tests/richtext.test.ts`:

- `sanitizeRichHtml`:保留白名单标签;剥除 `script`/`onerror`/`style` 属性;`javascript:` 链接被清除;`a` 补全 `rel`/`target`;空串返回空串。
- `isRichHtml`:`<p>x</p>` 为真;纯文本、含 `a < b` 数学符号的文本为假。
- `plainTextToHtml`:多行文本转多个 `<p>`;`<` 等字符被转义。

现有 `tests/content.test.ts`(pages CRUD)不受影响;`/api/admin/pages` 的 sanitize 行为通过对 `sanitizeRichHtml` 的单测覆盖。

## 明确不做

- 图片上传、表格、字体颜色等高级编辑功能。
- 存量数据迁移(靠 `isRichHtml` 双轨兼容)。
- 会议欢迎词、脚页、联系 HTML 等 Meeting 字段的编辑方式不变(仍为纯文本)。
