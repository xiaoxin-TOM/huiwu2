import { prisma } from "@/lib/prisma";

export function listPages() {
  return prisma.page.findMany({ orderBy: { slug: "asc" } });
}

export function upsertPage(slug: string, data: { title: string; contentHtml: string }) {
  return prisma.page.upsert({
    where: { slug },
    update: data,
    create: { slug, ...data },
  });
}
