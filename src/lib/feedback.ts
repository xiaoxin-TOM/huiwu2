import { prisma } from "@/lib/prisma";
import type { FeedbackInput, MeetingContactInput } from "@/lib/validation";

export function getMeetingContact(meetingId: string) {
  return prisma.meetingContact.findUnique({ where: { meetingId } });
}

export function upsertMeetingContact(meetingId: string, input: MeetingContactInput) {
  // 空字符串的二维码地址存 null，便于展示层直接按真假判断
  const data = {
    ...input,
    wecomQrUrl: input.wecomQrUrl || null,
    groupQrUrl: input.groupQrUrl || null,
    mpQrUrl: input.mpQrUrl || null,
  };
  return prisma.meetingContact.upsert({
    where: { meetingId },
    create: { meetingId, ...data },
    update: data,
  });
}

export function createFeedback(
  meetingId: string,
  userId: string | null,
  input: FeedbackInput,
) {
  return prisma.feedback.create({
    data: {
      meetingId,
      userId,
      category: input.category,
      content: input.content,
      contact: input.contact,
      imageUrl: input.imageUrl || null,
    },
  });
}

export type FeedbackFilters = { status?: "ALL" | "PENDING" | "RESOLVED"; category?: string };

export function listMeetingFeedback(meetingId: string, filters: FeedbackFilters = {}) {
  return prisma.feedback.findMany({
    where: {
      meetingId,
      ...(filters.status && filters.status !== "ALL" ? { status: filters.status } : {}),
      ...(filters.category && filters.category !== "ALL" ? { category: filters.category } : {}),
    },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export function listUserFeedback(userId: string, meetingId: string) {
  return prisma.feedback.findMany({
    where: { userId, meetingId },
    orderBy: { createdAt: "desc" },
  });
}

export function countPendingFeedback(meetingId: string) {
  return prisma.feedback.count({ where: { meetingId, status: "PENDING" } });
}

export function getFeedbackById(id: string) {
  return prisma.feedback.findUnique({ where: { id } });
}

export function replyFeedback(id: string, reply: string, repliedById: string) {
  return prisma.feedback.update({
    where: { id },
    data: { reply, repliedById, repliedAt: new Date(), status: "RESOLVED" },
  });
}

export function reopenFeedback(id: string) {
  return prisma.feedback.update({ where: { id }, data: { status: "PENDING" } });
}
