import { prisma } from "@/lib/prisma";

export function listPages() {
  return prisma.page.findMany({ orderBy: { slug: "asc" } });
}

export function getPage(slug: string) {
  return prisma.page.findUnique({ where: { slug } });
}

export function upsertPage(slug: string, data: { title: string; contentHtml: string }) {
  return prisma.page.upsert({
    where: { slug },
    update: data,
    create: { slug, ...data },
  });
}

export function updatePage(slug: string, data: { title: string; contentHtml: string }) {
  return prisma.page.update({
    where: { slug },
    data,
  });
}
