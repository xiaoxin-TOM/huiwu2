import { getNoticeById } from "@/lib/content";
import { requirePublicMeeting, jsonOk, jsonError } from "@/lib/public-api";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const meeting = await requirePublicMeeting();
    const { id } = await params;
    const notice = await getNoticeById(id, meeting.id);
    if (!notice) return jsonError("通知不存在", 404);
    return jsonOk({ notice });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "获取通知详情失败";
    return jsonError(msg, 500);
  }
}
