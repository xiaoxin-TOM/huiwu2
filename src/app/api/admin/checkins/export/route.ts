import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { listCheckinLogs } from "@/lib/registrations";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { toCsv } from "@/lib/csv";

export async function GET(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return new Response(JSON.stringify({ ok: false, error: "无权限" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const meeting = await requireCurrentMeetingForRequest(req);
  const logs = await listCheckinLogs(meeting.id);
  const csv = toCsv(
    ["姓名", "邮箱", "参会类型", "签到时间", "方式", "操作人ID"],
    logs.map((log) => [
      log.registration.fullName,
      log.registration.user.email,
      log.registration.type?.name ?? "",
      log.checkedAt.toISOString(),
      log.method,
      log.byUserId ?? "",
    ]),
  );
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="checkins-${meeting.id}.csv"`,
    },
  });
}
