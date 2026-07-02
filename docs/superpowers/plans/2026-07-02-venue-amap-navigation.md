# 会场交通页高德地图导航 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 会场交通页(`/venue`)嵌入高德地图展示会场位置并提供"导航到会场"按钮;会场坐标/名称/地址由管理员在后台"站点设置"配置。

**Architecture:** `SiteConfig` 表新增 4 个字符串字段(venueName/venueAddress/venueLng/venueLat),沿现有 站点设置表单 → `/api/admin/site` → zod 校验 → `updateSiteConfig` 链路扩展。前台用 `src/lib/venue.ts` 纯函数把配置解析为坐标(便于单测),`VenueMap` 客户端组件用 `@amap/amap-jsapi-loader` 渲染地图,导航按钮是纯链接(高德 URI API,不需要 key)。

**Tech Stack:** Next.js 16.2.9 (App Router) / Prisma 7 (PostgreSQL, `db push` 无 migrations) / zod / vitest / `@amap/amap-jsapi-loader`(新增依赖)

**Spec:** `docs/superpowers/specs/2026-07-02-venue-amap-navigation-design.md`

## Global Constraints

- 本项目 Next.js 版本(16.2.9)与常识可能不同;若对 API 有疑问,先读 `node_modules/next/dist/docs/` 再写代码。
- 界面文案一律中文,风格与现有页面一致(Tailwind,`SectionCard`/`PageHeader` 组件)。
- 数据库变更用 `npm run db:push`(项目无 migrations 目录);新字段必须带 `@default("")`,保证对存量行非破坏。
- 环境变量:`NEXT_PUBLIC_AMAP_KEY`(JS API key)、`NEXT_PUBLIC_AMAP_SECURITY_CODE`(可选安全密钥);未配置 key 时不渲染地图但导航按钮照常显示。
- 测试:vitest,测试文件放 `tests/`,用中文测试名,运行命令 `npx vitest run tests/<file> `。
- 路径别名 `@/` → `src/`。
- 提交信息用简短中文(参照 git log 风格)。

---

### Task 1: 校验规则 — siteConfigSchema 新增会场字段

**Files:**
- Modify: `src/lib/validation.ts:52-60`(siteConfigSchema)
- Test: `tests/validation-admin.test.ts`

**Interfaces:**
- Produces: `siteConfigSchema` 解析结果新增 `venueName: string; venueAddress: string; venueLng: string; venueLat: string`(均默认 `""`;经纬度非空时必须是数字且在 ±180/±90 内)。Task 2 的 API 路由依赖这些字段名。

- [ ] **Step 1: 写失败的测试**

在 `tests/validation-admin.test.ts` 文件末尾追加:

```ts
test("站点设置:会场坐标选填,非法值拒绝", () => {
  const base = { confName: "示例年会" };
  // 全部留空:通过,默认空串
  const empty = siteConfigSchema.safeParse(base);
  expect(empty.success).toBe(true);
  if (empty.success) {
    expect(empty.data.venueLng).toBe("");
    expect(empty.data.venueName).toBe("");
  }
  // 合法坐标:通过
  expect(
    siteConfigSchema.safeParse({
      ...base, venueLng: "116.397", venueLat: "39.909",
      venueName: "北京国际会议中心", venueAddress: "北辰东路8号",
    }).success
  ).toBe(true);
  // 非数字 / 越界:拒绝
  expect(siteConfigSchema.safeParse({ ...base, venueLng: "abc" }).success).toBe(false);
  expect(siteConfigSchema.safeParse({ ...base, venueLng: "181" }).success).toBe(false);
  expect(siteConfigSchema.safeParse({ ...base, venueLat: "-91" }).success).toBe(false);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/validation-admin.test.ts`
Expected: FAIL — `venueLng` 为 `undefined`(schema 尚无该字段)。

- [ ] **Step 3: 实现 schema**

在 `src/lib/validation.ts` 中,`siteConfigSchema` 上方加坐标字段工厂,并扩展 schema:

```ts
const coordField = (min: number, max: number, msg: string) =>
  z.string().optional().default("").refine((v) => {
    if (v === "") return true;
    const n = Number(v);
    return Number.isFinite(n) && n >= min && n <= max;
  }, msg);

export const siteConfigSchema = z.object({
  confName: z.string().min(1, "请填写会议名称"),
  confDate: z.string().optional().default(""),
  confLocation: z.string().optional().default(""),
  logoUrl: z.string().optional().default(""),
  liveUrl: z.string().optional().default(""),
  welcomeHtml: z.string().optional().default(""),
  footerHtml: z.string().optional().default(""),
  venueName: z.string().optional().default(""),
  venueAddress: z.string().optional().default(""),
  venueLng: coordField(-180, 180, "经度无效(-180~180)"),
  venueLat: coordField(-90, 90, "纬度无效(-90~90)"),
});
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/validation-admin.test.ts`
Expected: PASS(全部用例,含原有用例)。

- [ ] **Step 5: 提交**

```bash
git add src/lib/validation.ts tests/validation-admin.test.ts
git commit -m "站点设置校验新增会场坐标字段"
```

---

### Task 2: 数据模型与后台配置链路

**Files:**
- Modify: `prisma/schema.prisma`(SiteConfig model)
- Modify: `src/lib/siteconfig.ts`(updateSiteConfig 参数类型)
- Modify: `src/app/api/admin/site/route.ts`(读取 4 个新表单字段)
- Modify: `src/app/(admin)/admin/site/page.tsx`(表单新增 4 个输入框)

**Interfaces:**
- Consumes: Task 1 的 `siteConfigSchema`(已含 venue 字段,API 路由把表单值传给它即可)。
- Produces: `SiteConfig` Prisma 模型新增 `venueName/venueAddress/venueLng/venueLat: String @default("")`;`getSiteConfig()` 返回值自动带上这 4 个字段,Task 3/5 依赖。

- [ ] **Step 1: 扩展 Prisma 模型**

`prisma/schema.prisma` 的 `SiteConfig` model 中,`contactHtml` 行后追加:

```prisma
  venueName    String   @default("")
  venueAddress String   @default("")
  venueLng     String   @default("")
  venueLat     String   @default("")
```

- [ ] **Step 2: 同步数据库并重新生成 client**

Run: `npm run db:push`
Expected: 输出包含 "Your database is now in sync with your Prisma schema" 且自动执行 generate。若报连接失败,说明本地 PostgreSQL 未启动,须先启动再重试,不可跳过。

- [ ] **Step 3: 扩展 updateSiteConfig 参数类型**

`src/lib/siteconfig.ts` 中 `updateSiteConfig` 的 data 类型追加 4 个字段:

```ts
export function updateSiteConfig(data: {
  confName: string;
  confDate: string;
  confLocation: string;
  logoUrl: string;
  liveUrl: string;
  welcomeHtml: string;
  footerHtml: string;
  venueName: string;
  venueAddress: string;
  venueLng: string;
  venueLat: string;
}) {
```

函数体不变(upsert 直接透传 data)。

- [ ] **Step 4: API 路由读取新字段**

`src/app/api/admin/site/route.ts` 中 `siteConfigSchema.safeParse({...})` 的对象字面量追加:

```ts
    venueName: g("venueName"),
    venueAddress: g("venueAddress"),
    venueLng: g("venueLng"),
    venueLat: g("venueLat"),
```

- [ ] **Step 5: 后台表单新增输入框**

`src/app/(admin)/admin/site/page.tsx` 中,"直播地址"的 `</label>` 之后、"欢迎致辞"之前插入:

```tsx
        <label className="block text-sm text-gray-600">会场名称
          <input name="venueName" defaultValue={cfg?.venueName ?? ""}
            className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm text-gray-600">会场地址
          <input name="venueAddress" defaultValue={cfg?.venueAddress ?? ""}
            className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-gray-600">会场经度
            <input name="venueLng" defaultValue={cfg?.venueLng ?? ""} placeholder="116.397"
              className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label className="block text-sm text-gray-600">会场纬度
            <input name="venueLat" defaultValue={cfg?.venueLat ?? ""} placeholder="39.909"
              className="mt-1 w-full rounded border px-3 py-2" />
          </label>
        </div>
        <p className="text-xs text-gray-400">
          坐标可在
          <a href="https://lbs.amap.com/tools/picker" target="_blank" rel="noreferrer"
            className="text-sky-700 underline">高德坐标拾取器</a>
          中点选复制(经纬度填写后前台会场交通页将显示地图与导航按钮)
        </p>
```

- [ ] **Step 6: 全量测试与 lint**

Run: `npm test && npm run lint`
Expected: 全部 PASS,无 lint 错误(尤其确认 Prisma client 已重新生成,`cfg?.venueName` 不报类型错误)。

- [ ] **Step 7: 提交**

```bash
git add prisma/schema.prisma src/lib/siteconfig.ts "src/app/api/admin/site/route.ts" "src/app/(admin)/admin/site/page.tsx"
git commit -m "后台站点设置支持配置会场坐标"
```

---

### Task 3: 会场位置解析纯函数

**Files:**
- Create: `src/lib/venue.ts`
- Test: `tests/venue.test.ts`

**Interfaces:**
- Consumes: Task 2 的 `SiteConfig` 字段(仅按结构消费,不 import Prisma)。
- Produces:
  - `type VenueLocation = { lng: number; lat: number; name: string; address: string }`
  - `parseVenueLocation(cfg: { venueLng: string; venueLat: string; venueName: string; venueAddress: string } | null): VenueLocation | null` — 坐标任一为空或非法返回 null;name 为空时回退为 `"会场"`。
  - `amapNavUrl(loc: VenueLocation): string` — 高德 URI API 导航链接。
  - Task 5 的会场页依赖这两个函数。

- [ ] **Step 1: 写失败的测试**

创建 `tests/venue.test.ts`:

```ts
import { expect, test } from "vitest";
import { parseVenueLocation, amapNavUrl } from "@/lib/venue";

const cfg = (o: Partial<Record<string, string>>) => ({
  venueLng: "", venueLat: "", venueName: "", venueAddress: "", ...o,
});

test("会场位置:坐标齐全才返回,名称空时回退", () => {
  expect(parseVenueLocation(null)).toBeNull();
  expect(parseVenueLocation(cfg({}))).toBeNull();
  expect(parseVenueLocation(cfg({ venueLng: "116.397" }))).toBeNull();
  expect(parseVenueLocation(cfg({ venueLng: "abc", venueLat: "39.9" }))).toBeNull();
  const loc = parseVenueLocation(cfg({
    venueLng: "116.397", venueLat: "39.909",
    venueName: "北京国际会议中心", venueAddress: "北辰东路8号",
  }));
  expect(loc).toEqual({ lng: 116.397, lat: 39.909, name: "北京国际会议中心", address: "北辰东路8号" });
  const noName = parseVenueLocation(cfg({ venueLng: "116.397", venueLat: "39.909" }));
  expect(noName?.name).toBe("会场");
});

test("会场位置:导航链接指向高德 URI API 且名称已编码", () => {
  const url = amapNavUrl({ lng: 116.397, lat: 39.909, name: "北京国际会议中心", address: "" });
  expect(url).toBe(
    `https://uri.amap.com/navigation?to=116.397,39.909,${encodeURIComponent("北京国际会议中心")}&mode=car&callnative=1`
  );
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/venue.test.ts`
Expected: FAIL — 无法解析 `@/lib/venue` 模块。

- [ ] **Step 3: 实现**

创建 `src/lib/venue.ts`:

```ts
export type VenueLocation = {
  lng: number;
  lat: number;
  name: string;
  address: string;
};

export function parseVenueLocation(
  cfg: { venueLng: string; venueLat: string; venueName: string; venueAddress: string } | null
): VenueLocation | null {
  if (!cfg) return null;
  if (cfg.venueLng.trim() === "" || cfg.venueLat.trim() === "") return null;
  const lng = Number(cfg.venueLng);
  const lat = Number(cfg.venueLat);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { lng, lat, name: cfg.venueName || "会场", address: cfg.venueAddress };
}

// 高德 URI API:手机端 callnative=1 拉起高德 App 导航,电脑端打开网页版路线规划,无需 key
export function amapNavUrl(loc: VenueLocation): string {
  return `https://uri.amap.com/navigation?to=${loc.lng},${loc.lat},${encodeURIComponent(loc.name)}&mode=car&callnative=1`;
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/venue.test.ts`
Expected: PASS(2 个用例)。

- [ ] **Step 5: 提交**

```bash
git add src/lib/venue.ts tests/venue.test.ts
git commit -m "会场位置解析与导航链接函数"
```

---

### Task 4: VenueMap 地图客户端组件

**Files:**
- Modify: `package.json`(新增依赖)
- Create: `src/components/VenueMap.tsx`

**Interfaces:**
- Consumes: 无(自包含;坐标经 props 传入)。
- Produces: `VenueMap`(default export)客户端组件,props 为 `{ lng: number; lat: number; name: string; address: string }`。无 key 或加载失败时自行渲染为 null。Task 5 依赖。

- [ ] **Step 1: 安装高德官方 loader**

Run: `npm i @amap/amap-jsapi-loader`
Expected: 安装成功,`package.json` dependencies 出现 `@amap/amap-jsapi-loader`。

- [ ] **Step 2: 实现组件**

创建 `src/components/VenueMap.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";

type Props = { lng: number; lat: number; name: string; address: string };

// 高德地图实例仅需 destroy 能力,不引入完整类型定义
type AMapInstance = { destroy: () => void };

export default function VenueMap({ lng, lat, name, address }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const key = process.env.NEXT_PUBLIC_AMAP_KEY;

  useEffect(() => {
    if (!key || !containerRef.current) return;
    const securityCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE;
    if (securityCode) {
      (window as unknown as { _AMapSecurityConfig: { securityJsCode: string } })._AMapSecurityConfig =
        { securityJsCode: securityCode };
    }
    let map: AMapInstance | undefined;
    let cancelled = false;
    AMapLoader.load({ key, version: "2.0" })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 高德 JS API 无类型定义
      .then((AMap: any) => {
        if (cancelled || !containerRef.current) return;
        map = new AMap.Map(containerRef.current, { center: [lng, lat], zoom: 15 });
        const marker = new AMap.Marker({ position: [lng, lat], title: name });
        (map as unknown as { add: (m: unknown) => void }).add(marker);
        // 信息窗内容用 DOM 构建,避免管理员输入被当作 HTML 注入
        const content = document.createElement("div");
        content.style.padding = "4px 8px";
        const strong = document.createElement("strong");
        strong.textContent = name;
        content.append(strong);
        if (address) content.append(document.createElement("br"), address);
        const info = new AMap.InfoWindow({ content, offset: new AMap.Pixel(0, -30) });
        marker.on("click", () => info.open(map, [lng, lat]));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      map?.destroy();
    };
  }, [key, lng, lat, name, address]);

  if (!key || failed) return null;
  return <div ref={containerRef} className="h-80 w-full rounded-xl bg-slate-100" />;
}
```

- [ ] **Step 3: lint 与类型检查**

Run: `npm run lint && npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 4: 提交**

```bash
git add package.json package-lock.json src/components/VenueMap.tsx
git commit -m "高德地图 VenueMap 组件"
```

---

### Task 5: 会场页集成与环境变量示例

**Files:**
- Modify: `src/app/(public)/venue/page.tsx`
- Modify: `.env.example`
- Modify: `.env`(追加空值变量,便于本地填 key)

**Interfaces:**
- Consumes: `getSiteConfig()`(Task 2)、`parseVenueLocation`/`amapNavUrl`(Task 3)、`VenueMap`(Task 4)。

- [ ] **Step 1: 改写会场页**

将 `src/app/(public)/venue/page.tsx` 全文替换为:

```tsx
import { getPage } from "@/lib/content";
import { getSiteConfig } from "@/lib/siteconfig";
import { parseVenueLocation, amapNavUrl } from "@/lib/venue";
import RichText from "@/components/RichText";
import VenueMap from "@/components/VenueMap";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";

export default async function VenuePage() {
  const [page, cfg] = await Promise.all([getPage("venue"), getSiteConfig()]);
  const venue = parseVenueLocation(cfg);
  return (
    <div className="space-y-4">
      <PageHeader title={page?.title ?? "会场交通"} />
      <SectionCard>
        {page ? (
          <div className="prose max-w-none text-slate-600">
            <RichText html={page.contentHtml} />
          </div>
        ) : (
          <p className="text-slate-500">交通信息待发布。</p>
        )}
      </SectionCard>
      {venue && (
        <SectionCard>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold text-slate-800">{venue.name}</h2>
                {venue.address && <p className="text-sm text-slate-500">{venue.address}</p>}
              </div>
              <a
                href={amapNavUrl(venue)}
                target="_blank"
                rel="noreferrer"
                className="rounded bg-sky-700 px-4 py-2 text-sm text-white hover:bg-sky-800"
              >
                🧭 导航到会场
              </a>
            </div>
            <VenueMap lng={venue.lng} lat={venue.lat} name={venue.name} address={venue.address} />
          </div>
        </SectionCard>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 环境变量示例**

`.env.example` 末尾追加:

```bash
# 高德开放平台 Web端(JS API) key,申请:https://lbs.amap.com(留空则会场页不显示地图)
NEXT_PUBLIC_AMAP_KEY=""
# 高德 JS API 配套安全密钥(可选)
NEXT_PUBLIC_AMAP_SECURITY_CODE=""
```

`.env` 末尾追加同样两行(值留空,等用户申请后填写)。

- [ ] **Step 3: 全量验证**

Run: `npm test && npm run lint && npm run build`
Expected: 测试全 PASS,lint 无错误,build 成功。

- [ ] **Step 4: 手工验证(启动 dev)**

Run: `npm run dev`(端口 3003),访问 `http://localhost:3003/venue`:
- 未配坐标时:页面与改动前一致,无地图区块。
- 在 `/admin/site` 填入坐标(116.3972, 39.9909,北京国际会议中心)保存后:会场页出现名称/地址卡片与"导航到会场"按钮;key 未配时无地图但按钮可点,跳转到 uri.amap.com。
- 填入真实 key 后:地图渲染、标记可点出信息窗(此步待用户拿到 key 后验证)。

- [ ] **Step 5: 提交**

```bash
git add "src/app/(public)/venue/page.tsx" .env.example
git commit -m "会场交通页嵌入高德地图与一键导航"
```

注意:`.env` 不入库(确认其在 `.gitignore` 中),只改本地文件。
