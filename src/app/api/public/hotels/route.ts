import { listHotels } from "@/lib/hotels";
import { requirePublicMeeting, jsonOk, jsonError } from "@/lib/public-api";

export async function GET() {
  try {
    const meeting = await requirePublicMeeting();
    const hotels = await listHotels(meeting.id);
    return jsonOk({ hotels });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "获取酒店失败";
    return jsonError(msg, 500);
  }
}
