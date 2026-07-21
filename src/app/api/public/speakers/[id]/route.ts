import { getSpeakerById, getSpeakerSessions } from "@/lib/speakers";
import { requirePublicMeeting, jsonOk, jsonError } from "@/lib/public-api";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const meeting = await requirePublicMeeting();
    const { id } = await params;
    const speaker = await getSpeakerById(id, meeting.id);
    if (!speaker) return jsonError("讲者不存在", 404);
    const sessions = await getSpeakerSessions(id, meeting.id);
    return jsonOk({ speaker, sessions });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "获取讲者详情失败";
    return jsonError(msg, 500);
  }
}
