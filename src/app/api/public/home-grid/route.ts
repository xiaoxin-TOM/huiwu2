import { getPublicMeetingConfig, jsonOk, jsonError } from "@/lib/public-api";

export async function GET() {
  try {
    const config = await getPublicMeetingConfig();
    return jsonOk({
      meeting: config.meeting,
      cfg: config.cfg,
      homeGridItems: config.homeGridItems,
      homeGridColumns: config.homeGridColumns,
      homeGridRounded: config.homeGridRounded,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "获取首页配置失败";
    return jsonError(msg, 500);
  }
}
