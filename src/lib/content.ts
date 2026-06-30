import { prisma } from "@/lib/prisma";
import type { Notice, Page } from "@prisma/client";

export function getPublishedNotices(): Promise<Notice[]> {
  return prisma.notice.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getNoticeById(id: string): Promise<Notice | null> {
  const notice = await prisma.notice.findUnique({ where: { id } });
  if (!notice || !notice.isPublished) return null;
  return notice;
}

export function getPage(slug: string): Promise<Page | null> {
  return prisma.page.findUnique({ where: { slug } });
}
