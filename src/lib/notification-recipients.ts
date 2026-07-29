import { prisma } from "@/lib/prisma";

export type Recipient = { userId: string; email: string; name: string };

export type AdminRecipients = {
  /** 站内信收件人：owner + 全体 MeetingStaff */
  inApp: Recipient[];
  /** 邮件收件人：只有 owner，避免一条申请给每个协办都塞一封 */
  email: Recipient[];
};

/**
 * 解析某会议的管理员收件人。严格按会议隔离模型取人，不会跨会议通知。
 */
export async function resolveAdminRecipients(meetingId: string): Promise<AdminRecipients> {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: {
      owner: { select: { id: true, email: true, name: true, isActive: true } },
      staff: {
        select: { user: { select: { id: true, email: true, name: true, isActive: true } } },
      },
    },
  });
  if (!meeting) return { inApp: [], email: [] };

  const owner =
    meeting.owner && meeting.owner.isActive
      ? { userId: meeting.owner.id, email: meeting.owner.email, name: meeting.owner.name }
      : null;

  const staff = meeting.staff
    .map((s) => s.user)
    .filter((u) => u.isActive)
    .map((u) => ({ userId: u.id, email: u.email, name: u.name }));

  // owner 也可能同时在 staff 表里，按 userId 去重
  const seen = new Set<string>();
  const inApp: Recipient[] = [];
  for (const r of [...(owner ? [owner] : []), ...staff]) {
    if (seen.has(r.userId)) continue;
    seen.add(r.userId);
    inApp.push(r);
  }

  return { inApp, email: owner ? [owner] : [] };
}

/** 解析单个用户收件人；用户不存在或已停用则返回 null */
export async function resolveUserRecipient(userId: string): Promise<Recipient | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, isActive: true },
  });
  if (!user || !user.isActive) return null;
  return { userId: user.id, email: user.email, name: user.name };
}
