import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";
import { nextAttemptDelayMs, shouldGiveUp } from "@/lib/notification-templates";

/** 单次刷队列的处理上限，避免一口气打爆 126 邮箱的发信频率限制 */
export const FLUSH_BATCH_SIZE = 20;

export type FlushResult = { picked: number; sent: number; retry: number; failed: number };

/**
 * 取出到期的待发邮件并逐封发送。
 *
 * 串行发送而非并发：126 邮箱对并发连接很敏感，一次打出 20 条并发几乎必然限流。
 */
export async function flushNotificationDeliveries(limit = FLUSH_BATCH_SIZE): Promise<FlushResult> {
  const now = new Date();
  const pending = await prisma.notificationDelivery.findMany({
    where: { status: "PENDING", nextAttemptAt: { lte: now } },
    orderBy: { nextAttemptAt: "asc" },
    take: limit,
  });

  const result: FlushResult = { picked: pending.length, sent: 0, retry: 0, failed: 0 };

  for (const item of pending) {
    try {
      await sendNotificationEmail({
        to: item.toAddress,
        subject: item.subject,
        text: item.bodyText,
        html: item.bodyHtml || undefined,
      });
      await prisma.notificationDelivery.update({
        where: { id: item.id },
        data: { status: "SENT", sentAt: new Date(), attempts: item.attempts + 1, lastError: "" },
      });
      result.sent += 1;
    } catch (error) {
      const attempts = item.attempts + 1;
      const message = error instanceof Error ? error.message : String(error);
      if (shouldGiveUp(attempts)) {
        await prisma.notificationDelivery.update({
          where: { id: item.id },
          data: { status: "FAILED", attempts, lastError: message.slice(0, 500) },
        });
        result.failed += 1;
      } else {
        await prisma.notificationDelivery.update({
          where: { id: item.id },
          data: {
            attempts,
            lastError: message.slice(0, 500),
            nextAttemptAt: new Date(Date.now() + nextAttemptDelayMs(attempts)),
          },
        });
        result.retry += 1;
      }
    }
  }

  return result;
}

export function listDeliveries(status?: "PENDING" | "SENT" | "FAILED") {
  return prisma.notificationDelivery.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export function countFailedDeliveries() {
  return prisma.notificationDelivery.count({ where: { status: "FAILED" } });
}

/** 管理员手动重发：重置为待发并立即到期 */
export function requeueDelivery(id: string) {
  return prisma.notificationDelivery.update({
    where: { id },
    data: { status: "PENDING", attempts: 0, lastError: "", nextAttemptAt: new Date() },
  });
}

export function requeueAllFailed() {
  return prisma.notificationDelivery.updateMany({
    where: { status: "FAILED" },
    data: { status: "PENDING", attempts: 0, lastError: "", nextAttemptAt: new Date() },
  });
}
