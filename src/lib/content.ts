import { prisma } from "@/lib/prisma";
import type { Notice, Page } from "@prisma/client";

export function getPublishedNotices(meetingId: string): Promise<Notice[]> {
  return prisma.notice.findMany({
    where: { meetingId, isPublished: true },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getNoticeById(id: string, meetingId?: string): Promise<Notice | null> {
  const where: { id: string; meetingId?: string } = { id };
  if (meetingId) where.meetingId = meetingId;
  const notice = await prisma.notice.findFirst({ where });
  if (!notice || !notice.isPublished) return null;
  return notice;
}

export function getPage(slug: string, meetingId: string): Promise<Page | null> {
  return prisma.page.findUnique({
    where: { meetingId_slug: { meetingId, slug } },
  });
}
