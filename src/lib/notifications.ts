import { prisma } from "@/lib/prisma";
import {
  buildNotificationContent,
  type NotificationContext,
  type NotificationType,
} from "@/lib/notification-templates";
import { resolveAdminRecipients, resolveUserRecipient } from "@/lib/notification-recipients";

/**
 * 通知的统一入口。
 *
 * 铁律：通知永远不能拖垮业务。所有对外函数自行吞掉异常并记日志，
 * 调用方（审核接口）不必也不应该 try/catch，更不该因为通知失败而回滚。
 */

/** 发给管理员的事件 */
type SubmittedType = Extract<NotificationType, `${string}_SUBMITTED`>;

/** 发给申请人本人的事件。显式列举而非按后缀匹配——FEEDBACK_REPLIED 不叫 _REVIEWED */
type ReviewedType =
  | Extract<NotificationType, `${string}_REVIEWED`>
  | "FEEDBACK_REPLIED";

async function writeInApp(
  recipients: { userId: string }[],
  meetingId: string,
  type: NotificationType,
  content: { title: string; body: string; linkHref: string },
) {
  if (recipients.length === 0) return [];
  await prisma.notification.createMany({
    data: recipients.map((r) => ({
      userId: r.userId,
      meetingId,
      type,
      title: content.title,
      body: content.body,
      linkHref: content.linkHref,
    })),
  });
  return recipients;
}

async function enqueueEmails(
  recipients: { email: string }[],
  content: { subject: string; emailText: string },
) {
  const targets = recipients.filter((r) => r.email?.includes("@"));
  if (targets.length === 0) return;
  await prisma.notificationDelivery.createMany({
    data: targets.map((r) => ({
      toAddress: r.email,
      subject: content.subject,
      bodyText: content.emailText,
      bodyHtml: `<p>${escapeHtml(content.emailText)}</p>`,
    })),
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 用户提交了申请 → 通知该会议的管理员 */
export async function notifyAdminsOfSubmission(
  type: SubmittedType,
  params: { meetingId: string; actorName?: string; subjectTitle?: string },
): Promise<void> {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: params.meetingId },
      select: { id: true, title: true },
    });
    if (!meeting) return;

    const content = buildNotificationContent({
      type,
      meeting,
      actorName: params.actorName,
      subjectTitle: params.subjectTitle,
    } satisfies NotificationContext);

    const { inApp, email } = await resolveAdminRecipients(meeting.id);
    await writeInApp(inApp, meeting.id, type, content);
    await enqueueEmails(email, content);
  } catch (error) {
    // 通知失败绝不影响已完成的业务操作
    console.error("[notify admins]", type, params.meetingId, error);
  }
}

/** 管理员审核完毕 → 通知申请人 */
export async function notifyUserOfReview(
  type: ReviewedType,
  params: {
    meetingId: string;
    userId: string;
    decision: "APPROVED" | "REJECTED";
    subjectTitle?: string;
    reviewNote?: string;
  },
): Promise<void> {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: params.meetingId },
      select: { id: true, title: true },
    });
    if (!meeting) return;

    const recipient = await resolveUserRecipient(params.userId);
    if (!recipient) return;

    const content = buildNotificationContent({
      type,
      meeting,
      decision: params.decision,
      subjectTitle: params.subjectTitle,
      reviewNote: params.reviewNote,
    } satisfies NotificationContext);

    await writeInApp([recipient], meeting.id, type, content);
    await enqueueEmails([recipient], content);
  } catch (error) {
    console.error("[notify user]", type, params.userId, error);
  }
}

export function listUserNotifications(userId: string, meetingId?: string) {
  return prisma.notification.findMany({
    where: { userId, ...(meetingId ? { meetingId } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export function countUnreadNotifications(userId: string, meetingId?: string) {
  return prisma.notification.count({
    where: { userId, readAt: null, ...(meetingId ? { meetingId } : {}) },
  });
}

export function markNotificationRead(id: string, userId: string) {
  // 带上 userId 条件，避免越权把别人的消息标记已读
  return prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export function markAllNotificationsRead(userId: string, meetingId?: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null, ...(meetingId ? { meetingId } : {}) },
    data: { readAt: new Date() },
  });
}
