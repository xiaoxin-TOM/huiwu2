/**
 * 通知文案与重试策略——纯函数，不碰数据库与 Next 运行时，可完整单测。
 * 所有对外可见的文字集中在本文件，改文案不必翻业务代码。
 */

export const NOTIFICATION_TYPES = [
  "REGISTRATION_SUBMITTED",
  "REGISTRATION_REVIEWED",
  "SUBMISSION_SUBMITTED",
  "SUBMISSION_REVIEWED",
  "BOOKING_SUBMITTED",
  "BOOKING_REVIEWED",
  "MATERIAL_SUBMITTED",
  "MATERIAL_REVIEWED",
  "FEEDBACK_SUBMITTED",
  "FEEDBACK_REPLIED",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationDecision = "APPROVED" | "REJECTED";

export type NotificationContext = {
  type: NotificationType;
  meeting: { id: string; title: string };
  /** 提交人姓名，提交类通知用 */
  actorName?: string;
  /** 被操作对象的标题，如论文题目、文件名、酒店名 */
  subjectTitle?: string;
  decision?: NotificationDecision;
  reviewNote?: string;
};

export type NotificationContent = {
  title: string;
  body: string;
  /** 站内信点击后跳转的位置 */
  linkHref: string;
  subject: string;
  emailText: string;
};

const SUBMITTED_META: Record<string, { label: string; href: string }> = {
  REGISTRATION_SUBMITTED: { label: "报名申请", href: "/admin/registrations" },
  SUBMISSION_SUBMITTED: { label: "论文投稿", href: "/admin/submissions" },
  BOOKING_SUBMITTED: { label: "酒店预订", href: "/admin/bookings" },
  MATERIAL_SUBMITTED: { label: "讲者资料", href: "/admin/submissions?tab=materials" },
  FEEDBACK_SUBMITTED: { label: "用户反馈", href: "/admin/feedback" },
};

const REVIEWED_META: Record<string, { label: string; path: string }> = {
  REGISTRATION_REVIEWED: { label: "报名申请", path: "/me" },
  SUBMISSION_REVIEWED: { label: "论文投稿", path: "/submissions" },
  BOOKING_REVIEWED: { label: "酒店预订", path: "/me" },
  MATERIAL_REVIEWED: { label: "报告资料", path: "/me/speaker-materials" },
  FEEDBACK_REPLIED: { label: "反馈", path: "/feedback" },
};

function decisionWord(decision: NotificationDecision | undefined): string {
  return decision === "REJECTED" ? "未通过" : "已通过";
}

export function buildNotificationContent(ctx: NotificationContext): NotificationContent {
  const meetingTitle = ctx.meeting.title;
  const submitted = SUBMITTED_META[ctx.type];

  if (submitted) {
    const who = ctx.actorName?.trim() || "有用户";
    const what = ctx.subjectTitle?.trim();
    const title = `新的${submitted.label}待处理`;
    const body = what
      ? `${who} 在「${meetingTitle}」提交了${submitted.label}：${what}，请及时处理。`
      : `${who} 在「${meetingTitle}」提交了${submitted.label}，请及时处理。`;
    return {
      title,
      body,
      linkHref: submitted.href,
      subject: `【${meetingTitle}】${title}`,
      emailText: body,
    };
  }

  const reviewed = REVIEWED_META[ctx.type];
  const word = decisionWord(ctx.decision);
  const what = ctx.subjectTitle?.trim();
  const label = reviewed?.label ?? "申请";
  const title = `您的${label}${word}`;

  const reason =
    ctx.decision === "REJECTED"
      ? ctx.reviewNote?.trim()
        ? `原因：${ctx.reviewNote.trim()}`
        : "请登录查看详情。"
      : "";
  const bodyParts = [
    what
      ? `您在「${meetingTitle}」提交的${label}「${what}」审核${word}。`
      : `您在「${meetingTitle}」提交的${label}审核${word}。`,
    reason,
  ].filter(Boolean);

  return {
    title,
    body: bodyParts.join(""),
    linkHref: `/m/${ctx.meeting.id}${reviewed?.path ?? "/me"}`,
    subject: `【${meetingTitle}】${title}`,
    emailText: bodyParts.join(""),
  };
}

/** 第 n 次失败后等待多久再试。索引从 1 开始。 */
const BACKOFF_MS = [60 * 1000, 5 * 60 * 1000, 30 * 60 * 1000, 2 * 60 * 60 * 1000];

export const MAX_DELIVERY_ATTEMPTS = 5;

export function nextAttemptDelayMs(attempts: number): number {
  if (attempts < 1) return BACKOFF_MS[0];
  // 超出退避表时复用最后一档，避免越界返回 undefined
  return BACKOFF_MS[Math.min(attempts, BACKOFF_MS.length) - 1];
}

export function shouldGiveUp(attempts: number): boolean {
  return attempts >= MAX_DELIVERY_ATTEMPTS;
}
