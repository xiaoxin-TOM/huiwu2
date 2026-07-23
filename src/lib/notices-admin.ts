import { prisma } from "@/lib/prisma";

export function listAllNotices(meetingId: string) {
  return prisma.notice.findMany({
    where: { meetingId },
    orderBy: { publishedAt: "desc" },
  });
}

export function getNotice(id: string, meetingId?: string) {
  const where: { id: string; meetingId?: string } = { id };
  if (meetingId) where.meetingId = meetingId;
  return prisma.notice.findFirst({ where });
}

type NoticeData = { title: string; contentHtml: string; isPublished: boolean; mode?: string; imageUrl?: string };

export function createNotice(meetingId: string, data: NoticeData) {
  return prisma.notice.create({ data: { ...data, meetingId } });
}

export function updateNotice(id: string, data: NoticeData) {
  return prisma.notice.update({ where: { id }, data });
}

export function deleteNotice(id: string) {
  return prisma.notice.delete({ where: { id } });
}
