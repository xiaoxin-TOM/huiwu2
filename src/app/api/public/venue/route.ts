import { getPage } from "@/lib/content";
import { parseVenueLocation } from "@/lib/venue";
import { requirePublicMeeting, jsonOk, jsonError } from "@/lib/public-api";

export async function GET() {
  try {
    const meeting = await requirePublicMeeting();
    const page = await getPage("venue", meeting.id);
    const venue = parseVenueLocation(meeting);
    return jsonOk({ page, venue });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "获取会场信息失败";
    return jsonError(msg, 500);
  }
}
