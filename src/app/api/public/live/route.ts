import { listVisibleLiveStreams } from "@/lib/live";
import { requirePublicMeeting, jsonOk, jsonError } from "@/lib/public-api";

export async function GET() {
  try {
    const meeting = await requirePublicMeeting();
    const streams = await listVisibleLiveStreams(meeting.id);
    return jsonOk({ streams });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "获取直播失败";
    return jsonError(msg, 500);
  }
}
