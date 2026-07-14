import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { listSubmissions } from "@/lib/submissions";
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
  const subs = await listSubmissions(meeting.id);
  const csv = toCsv(
    ["论文题目", "作者", "投稿人邮箱", "状态", "提交时间"],
    subs.map((s) => [
      s.title, s.authors, s.user.email, s.status, s.createdAt.toISOString(),
    ]),
  );
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="submissions-${meeting.id}.csv"`,
    },
  });
}
