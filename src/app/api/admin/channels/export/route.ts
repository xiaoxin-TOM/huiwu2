import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { exportChannelStatsCsv } from "@/lib/channels-admin";

export async function GET(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return new Response(JSON.stringify({ ok: false, error: "无权限" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const meeting = await requireCurrentMeetingForRequest(req);
  const csv = await exportChannelStatsCsv(meeting.id);
  return new Response("\ufeff" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="channels-${meeting.id}.csv"`,
    },
  });
}
