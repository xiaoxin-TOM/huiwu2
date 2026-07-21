import { getAllSpeakers, filterSpeakers } from "@/lib/speakers";
import { requirePublicMeeting, jsonOk, jsonError } from "@/lib/public-api";

export async function GET(req: Request) {
  try {
    const meeting = await requirePublicMeeting();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const all = await getAllSpeakers(meeting.id);
    const speakers = filterSpeakers(all, q);
    return jsonOk({ speakers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "获取讲者失败";
    return jsonError(msg, 500);
  }
}
