# 会务管理系统 设计文档 (Conference Management System)

- 日期: 2026-06-29
- 状态: 已确认设计,待编写实现计划
- 参考: https://mm.sciconf.cn/cn/minisite/index/36289 (学术会议会务小站)

## 1. 目标与范围

构建一个**单会议**的会务管理系统:面向参会者的前台站点 + 面向组织者的管理后台。
功能对标参考站点,系统服务于"一个会议",所有内容通过后台维护(非多租户多会议平台)。

不在本期范围:多会议/多租户、自建视频推拉流、在线支付收款、移动端原生 App。

## 2. 技术栈

- 框架: Next.js (App Router) + TypeScript
- 数据: Prisma ORM + SQLite(开发)/ PostgreSQL(生产)
- 鉴权: Auth.js (NextAuth) Credentials Provider,密码 bcrypt 哈希,角色 `USER` / `ADMIN`
- 样式: Tailwind CSS
- 校验: zod
- 文件上传: 开发期存本地 `public/uploads`(论文 PDF、图片直播照片),路径存库

## 3. 整体架构

单一 Next.js 项目,三个路由分区:

- `app/(public)/*` — 前台站点(Server Component 直连 Prisma 读取)
- `app/(admin)/*` — 管理后台,middleware 校验 `ADMIN` 角色
- `app/api/*` — 写操作接口(报名、投稿、预订、上传)及鉴权

数据流:
- 读:前台页面用 Server Component 直接查询 Prisma。
- 写:经 API Route,zod 校验入参,校验登录态/角色后落库。
- 错误:统一返回结构 `{ ok: false, error }`;表单展示字段级错误;上传限制类型与大小。

## 4. 前台功能(对应参考站点导航)

1. **首页 / 欢迎致辞** — Hero(会议名称/时间/地点)+ 主办方致辞富文本。
2. **会议通知** — 通知列表 + 详情页。
3. **注册报名** — 登录后填写报名表,选择参会类型(对应费用),提交后可查看审核状态。
4. **论文/摘要提交** — 登录后填写题目/作者/摘要并上传 PDF,查看审核状态。
5. **简明日程** — 精简时间表概览。
6. **详细日程** — 按天 / 分会场(track/room)/ 时间段展示场次,关联讲者与主持人。
7. **讲者/主持人查询** — 列表 + 按姓名/单位搜索,点击查看简介。
8. **会场交通** — 富文本图文 + 地图(嵌入静态图或地图链接)。
9. **联系方式** — 组织方联系信息。
10. **酒店预订** — 酒店列表(图片/价格/简介)+ 在线预订申请。
11. **直播** — 嵌入外部播放地址(后台配置 URL,前台 iframe/播放器加载)。
12. **图片直播** — 按相册(可对应场次/日期)浏览照片。
13. **个人中心** — 我的报名 / 我的投稿 / 我的酒店申请及其状态。

注册/登录:参会者需注册账号后才能报名、投稿、查看个人状态。

## 5. 管理后台功能

- **仪表盘** — 报名/投稿/预订数量概览。
- **站点设置** — 会议基本信息、Logo、直播嵌入地址(SiteConfig)。
- **内容管理** — 致辞 / 交通 / 联系方式等富文本页(Page),通知(Notice)增删改查。
- **日程管理** — 场次(Session)增删改查,指派讲者/主持人。
- **讲者管理** — 讲者/主持人(Speaker)增删改查。
- **报名管理** — 报名列表、审核(通过/拒绝)、导出 CSV。
- **论文管理** — 投稿列表、下载 PDF、审核(通过/拒绝)。
- **酒店管理** — 酒店增删改查 + 预订申请处理。
- **图片直播管理** — 相册创建、照片批量上传/删除。
- **用户管理** — 用户列表、角色管理。

## 6. 数据模型 (Prisma 主要实体)

- `User` — id, name, email(唯一), passwordHash, phone, organization, role(USER/ADMIN), createdAt
- `SiteConfig` — 单行:会议名称、时间、地点、Logo、致辞默认、直播地址、联系方式
- `Page` — slug(welcome/venue/contact 等), title, contentHtml
- `Notice` — id, title, contentHtml, publishedAt, isPublished
- `RegistrationType` — id, name, fee, description
- `Registration` — id, userId, typeId, fields(姓名/单位/职称等), status(PENDING/APPROVED/REJECTED), createdAt
- `Submission` — id, userId, title, authors, abstract, fileUrl, status, createdAt
- `Speaker` — id, name, title, organization, bio, photoUrl, isModerator
- `Session` — id, day(日期), startTime, endTime, room/track, title, speakerIds(关联), moderatorIds, isBrief(是否进简明日程)
- `Hotel` — id, name, description, price, address, imageUrl, distance
- `HotelBooking` — id, userId, hotelId, checkIn, checkOut, rooms, status, createdAt
- `Album` — id, title, date, sessionRef(可选), coverUrl
- `Photo` — id, albumId, url, caption, createdAt

(场次与讲者多对多通过关联表;字段在实现时按需细化。)

## 7. 鉴权与权限

- Auth.js Credentials 登录,session 含 role。
- middleware 拦截 `/(admin)` 与管理 API,非 ADMIN 拒绝。
- 个人中心 API 仅返回当前用户自己的数据。
- 首个 ADMIN 通过 seed 脚本创建。

## 8. 测试策略

采用 TDD。关键集成测试:
- 注册 / 登录 / 会话与角色。
- 报名提交 → 后台审核 → 状态回显。
- 论文上传 → 后台下载/审核。
- 酒店预订申请流程。
- 后台对日程/讲者/通知的增删改查。
- 后台路由的角色访问控制(USER 被拒)。

## 9. 实现分期

1. **基础框架 + 鉴权** — 项目脚手架、Prisma schema、Auth.js、布局/导航、seed。
2. **内容与展示** — 致辞/通知/交通/联系、日程(简明+详细)、讲者查询。
3. **报名与投稿** — 报名表+类型、论文提交、个人中心、对应后台审核。
4. **酒店 / 图片直播 / 直播** — 酒店与预订、相册与照片上传、直播嵌入。
5. **后台完善与收尾** — 仪表盘、导出、用户管理、整体打磨与测试补齐。

每期可独立运行验证。
