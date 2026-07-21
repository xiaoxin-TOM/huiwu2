import { getPage } from "@/lib/content";
import { requirePublicMeeting, jsonOk, jsonError } from "@/lib/public-api";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const meeting = await requirePublicMeeting();
    const { slug } = await params;
    const page = await getPage(slug, meeting.id);
    return jsonOk({ page });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "获取页面失败";
    return jsonError(msg, 500);
  }
}
