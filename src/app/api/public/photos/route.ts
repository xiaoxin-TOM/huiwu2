import { listAlbumsAdmin } from "@/lib/albums";
import { requirePublicMeeting, jsonOk, jsonError } from "@/lib/public-api";

export async function GET() {
  try {
    const meeting = await requirePublicMeeting();
    const albums = await listAlbumsAdmin(meeting.id);
    return jsonOk({ albums });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "获取相册失败";
    return jsonError(msg, 500);
  }
}
