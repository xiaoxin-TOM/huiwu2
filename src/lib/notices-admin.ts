import { prisma } from "@/lib/prisma";

export function listAllNotices() {
  return prisma.notice.findMany({ orderBy: { publishedAt: "desc" } });
}

export function getNotice(id: string) {
  return prisma.notice.findUnique({ where: { id } });
}

export function createNotice(data: { title: string; contentHtml: string; isPublished: boolean }) {
  return prisma.notice.create({ data });
}

export function updateNotice(
  id: string,
  data: { title: string; contentHtml: string; isPublished: boolean },
) {
  return prisma.notice.update({ where: { id }, data });
}

export function deleteNotice(id: string) {
  return prisma.notice.delete({ where: { id } });
}
