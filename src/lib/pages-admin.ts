import { prisma } from "@/lib/prisma";

export function listPages(meetingId: string) {
  return prisma.page.findMany({ where: { meetingId }, orderBy: { slug: "asc" } });
}

export function getPageBySlug(slug: string, meetingId: string) {
  return prisma.page.findUnique({
    where: { meetingId_slug: { meetingId, slug } },
  });
}

type PageData = { title: string; contentHtml: string; mode?: string; imageUrl?: string };

export function upsertPage(meetingId: string, slug: string, data: PageData) {
  return prisma.page.upsert({
    where: { meetingId_slug: { meetingId, slug } },
    update: data,
    create: { meetingId, slug, ...data },
  });
}

export function updatePage(meetingId: string, slug: string, data: PageData) {
  return prisma.page.update({
    where: { meetingId_slug: { meetingId, slug } },
    data,
  });
}
