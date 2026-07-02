# 会场交通页高德地图导航 — 设计文档

日期:2026-07-02

## 目标

在会场交通页(`/venue`)增加高德地图展示会场位置,并提供"导航到会场"按钮:手机上拉起高德 App 直接进入导航,电脑上打开高德网页版路线规划。会场位置信息由管理员在后台配置。

## 方案选型

- **采用**:高德 JS API 交互地图(`@amap/amap-jsapi-loader`)+ 高德 URI API 导航跳转。
- 不采用静态地图图片:同样需要 key,但不可缩放拖动,体验差且不省事。
- 不采用页面内路径规划:开发量大,URI 跳转已覆盖导航需求(与第 4 期直播外链跳转的思路一致)。

## 数据模型

`SiteConfig` 新增 4 个字段(均为 `String @default("")`):

| 字段 | 含义 |
|------|------|
| `venueName` | 会场名称(地图标记与导航目的地名称) |
| `venueAddress` | 会场地址(信息窗展示) |
| `venueLng` | 经度(高德坐标系,字符串) |
| `venueLat` | 纬度(高德坐标系,字符串) |

坐标存字符串,与 `SiteConfig` 现有字段风格一致,避免浮点精度问题;留空表示未配置。

## 环境变量

- `NEXT_PUBLIC_AMAP_KEY`:高德开放平台 Web 端(JS API)key。
- `NEXT_PUBLIC_AMAP_SECURITY_CODE`(可选):配套安全密钥;若配置,按高德要求在加载 JS API 前设置 `window._AMapSecurityConfig`。

key 由用户在 lbs.amap.com 自行申请;未配置时前台不渲染地图。

## 后台

`admin/site` 站点设置表单新增 4 个输入框(会场名称、会场地址、经度、纬度),旁附提示链接:高德坐标拾取器 `https://lbs.amap.com/tools/picker`。`/api/admin/site` 与校验逻辑同步接收这 4 个字段:

- 4 个字段均允许为空。
- 若经度或纬度非空,必须是合法数字且在有效范围(经度 -180~180,纬度 -90~90),否则报错。

## 前台

`/venue` 页在现有富文本卡片下方新增一个区块,包含两部分:

1. **`VenueMap` 客户端组件**(`"use client"`,新文件 `src/components/VenueMap.tsx`):
   - 用 `@amap/amap-jsapi-loader` 加载高德 JS API(需 `npm i @amap/amap-jsapi-loader`)。
   - 渲染地图容器(约 320~400px 高,圆角卡片风格与现有 `SectionCard` 一致),会场位置打标记,点击标记弹出信息窗显示会场名称与地址。
   - 组件卸载时销毁地图实例。
2. **"导航到会场"按钮**:链接到高德 URI API
   `https://uri.amap.com/navigation?to=<lng>,<lat>,<encodeURIComponent(venueName)>&mode=car&callnative=1`,
   `target="_blank"`。手机端 `callnative=1` 拉起高德 App,无 App 或电脑端则打开网页版。此跳转不需要 key。

### 渲染条件与容错

- 服务端读取 `SiteConfig`,若 `venueLng`/`venueLat` 任一为空,整个地图区块不渲染,页面与现状一致。
- 坐标已配置但 `NEXT_PUBLIC_AMAP_KEY` 未配置:不渲染地图,仍渲染导航按钮(按钮不依赖 key)。
- JS API 加载失败(key 无效、断网等):地图容器隐藏或显示简短占位文案,导航按钮不受影响,不得白屏或报未捕获异常。

## 测试

- 校验逻辑单测:坐标为空通过;非数字/越界拒绝。
- `VenueMap` 不做真实地图渲染测试(依赖外部脚本),仅保证页面在无 key、无坐标时的条件渲染正确。
- 手工验证:配置真实 key 与坐标后,地图显示、标记信息窗、导航按钮跳转(手机/电脑各一次)。

## 不做的事

- 页面内路径规划、公交换乘查询。
- 后台地图选点(管理员用坐标拾取器手动填写即可)。
- 多会场支持。
