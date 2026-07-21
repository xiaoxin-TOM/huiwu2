import { getPublishedNotices } from "@/lib/content";
import { requirePublicMeeting, jsonOk, jsonError } from "@/lib/public-api";

export async function GET() {
  try {
    const meeting = await requirePublicMeeting();
    const notices = await getPublishedNotices(meeting.id);
    return jsonOk({ notices });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "获取通知失败";
    return jsonError(msg, 500);
  }
}
