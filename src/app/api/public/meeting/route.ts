import { getPublicMeetingConfig, jsonOk, jsonError } from "@/lib/public-api";

export async function GET() {
  try {
    const config = await getPublicMeetingConfig();
    return jsonOk({
      meeting: {
        id: config.meeting.id,
        title: config.meeting.title,
        confDate: config.cfg.confDate,
        location: config.cfg.confLocation,
        logoUrl: config.cfg.logoUrl,
        heroImageUrl: config.cfg.heroImageUrl,
        welcomeHtml: config.cfg.welcomeHtml,
        footerHtml: config.cfg.footerHtml,
        contactHtml: config.cfg.contactHtml,
        liveUrl: config.cfg.liveUrl,
      },
      homeGrid: {
        columns: config.homeGridColumns,
        rounded: config.homeGridRounded,
        items: config.homeGridItems.filter((item) => item.isVisible),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "获取会议配置失败";
    return jsonError(msg, 500);
  }
}
