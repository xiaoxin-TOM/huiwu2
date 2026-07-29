# 通知中心设计

日期：2026-07-29

## 背景

系统里 8 个需要通知的触点目前一个通知都没有：用户提交报名/投稿/酒店预订/讲者材料后管理员不知情，管理员审核通过或驳回后用户也不知情。现有发送能力只有 `sendVerificationCode` 一个函数，写死 `smtp.126.com`，无模板、无重试。

通知是横切能力，先于其余待办功能建设，后续功能接入即可，避免日后回头改所有审核调用点。

## 已确认的决策

| 决策点 | 结论 | 理由 |
|---|---|---|
| 渠道 | 站内信为主 + 邮件补充 | 126 邮箱 SMTP 发批量业务信极易限流与进垃圾箱；站内信不依赖外部服务，必达且可回溯 |
| 发信可靠性 | 落库排队 + 自动重试 | 审核接口绝不能因发信失败而失败；失败可查、可手动重发 |
| 重试驱动 | 受保护的 cron 接口 | 项目无队列/无后台任务；时机可预测，且可控发信速率避开限流 |
| 管理员通知范围 | 站内信给 owner + 全体 MeetingStaff，邮件只给 owner | 协办都能看到待办，但不让一条报名给五个人各塞一封邮件 |

## 数据模型

```prisma
model Notification {
  id        String    @id @default(cuid())
  userId    String
  meetingId String?
  type      String
  title     String
  body      String    @default("")
  linkHref  String    @default("")
  readAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([userId, readAt])
  @@index([meetingId])
}

model NotificationDelivery {
  id             String    @id @default(cuid())
  notificationId String?
  toAddress      String
  subject        String
  bodyText       String
  bodyHtml       String    @default("")
  status         String    @default("PENDING") // PENDING | SENT | FAILED
  attempts       Int       @default(0)
  lastError      String    @default("")
  nextAttemptAt  DateTime  @default(now())
  sentAt         DateTime?
  createdAt      DateTime  @default(now())

  @@index([status, nextAttemptAt])
}
```

## 事件目录

| 事件 type | 触发点 | 收件人 | 站内信 | 邮件 |
|---|---|---|---|---|
| `REGISTRATION_SUBMITTED` | 提交报名且需审核 | 管理员 | 全员 | owner |
| `REGISTRATION_REVIEWED` | 报名通过/驳回 | 报名用户 | ✓ | ✓ |
| `SUBMISSION_SUBMITTED` | 提交论文投稿 | 管理员 | 全员 | owner |
| `SUBMISSION_REVIEWED` | 投稿通过/驳回 | 投稿用户 | ✓ | ✓ |
| `BOOKING_SUBMITTED` | 提交酒店预订 | 管理员 | 全员 | owner |
| `BOOKING_REVIEWED` | 预订通过/驳回 | 预订用户 | ✓ | ✓ |
| `MATERIAL_SUBMITTED` | 讲者上传材料 | 管理员 | 全员 | owner |
| `MATERIAL_REVIEWED` | 材料通过/驳回 | 讲者 | ✓ | ✓ |

驳回通知带审核备注。目前只有 `SpeakerMaterial.reviewNote` 有该字段，其余三类不在本批次补充，文案统一写「请登录查看详情」。

## 模块划分

- `src/lib/notification-templates.ts` — 纯函数：事件 + 上下文 → `{title, body, linkHref, subject, emailText}`。全部文案集中于此，可完整单测。
- `src/lib/notification-recipients.ts` — 解析收件人：管理员侧 = owner + MeetingStaff（站内信）/ owner（邮件）。
- `src/lib/notifications.ts` — 写站内信、入队邮件、已读标记、未读计数。
- `src/lib/notification-delivery.ts` — 出队、发送、退避重试。退避为纯函数，单独单测。

## 关键约束

1. **通知不得拖垮主流程。** 通知写入位于业务事务之外，整体 `try/catch`；写失败只记日志，绝不回滚已完成的审核。
2. **退避重试。** 失败后依次等待 1 分钟 / 5 分钟 / 30 分钟 / 2 小时；第 5 次仍失败标记 `FAILED`，后台可见并可手动重发。
3. **限速。** `POST /api/cron/flush-notifications` 每次最多处理 20 封，用 `CRON_SECRET` 请求头鉴权。
4. **会议隔离。** 管理员侧收件人解析必须走 owner + MeetingStaff，不得跨会议通知。

## 界面

- 用户端：`/m/[id]/notifications`，个人中心入口显示未读数。
- 管理员端：`AdminShell` 顶部铃铛 + 未读红点；`/admin/notifications` 列表，失败邮件可手动重发。

## 运维配置

```bash
# .env
CRON_SECRET="随机串"

# crontab
* * * * * curl -s -X POST -H "x-cron-secret: 随机串" http://localhost:3003/api/cron/flush-notifications
```

## 不做的事

- 不加短信通道（需短信资质与模板报备，且 `User.phone` 当前是选填）。
- 不做通知偏好设置（用户自选订阅哪些事件），本批次全部固定。
- 不为报名/投稿/预订补驳回原因字段。
