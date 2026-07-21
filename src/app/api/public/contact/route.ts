import { getPage } from "@/lib/content";
import { requirePublicMeeting, jsonOk, jsonError } from "@/lib/public-api";
import { getPublicConfig } from "@/lib/public";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const meeting = await requirePublicMeeting();
    const siteConfig = await prisma.siteConfig.findUnique({ where: { id: 1 } });
    const cfg = getPublicConfig(meeting, siteConfig);
    const page = await getPage("contact", meeting.id);
    return jsonOk({ page, contactHtml: cfg.contactHtml });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "获取联系方式失败";
    return jsonError(msg, 500);
  }
}
