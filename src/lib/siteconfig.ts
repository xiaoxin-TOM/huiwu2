import { prisma } from "@/lib/prisma";

export function getSiteConfig() {
  return prisma.siteConfig.findUnique({ where: { id: 1 } });
}

export function updateSiteConfig(data: {
  confName: string;
  confDate: string;
  confLocation: string;
  logoUrl: string;
  liveUrl: string;
  welcomeHtml: string;
  footerHtml: string;
  venueName: string;
  venueAddress: string;
  venueLng: string;
  venueLat: string;
}) {
  return prisma.siteConfig.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
}
