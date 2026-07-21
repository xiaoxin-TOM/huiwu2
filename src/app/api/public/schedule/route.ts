import { getDetailedSessions, groupByDayAndRoom } from "@/lib/schedule";
import { requirePublicMeeting, jsonOk, jsonError } from "@/lib/public-api";

export async function GET() {
  try {
    const meeting = await requirePublicMeeting();
    const sessions = await getDetailedSessions(meeting.id);
    const grouped = groupByDayAndRoom(sessions);
    return jsonOk({ grouped });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "获取日程失败";
    return jsonError(msg, 500);
  }
}
