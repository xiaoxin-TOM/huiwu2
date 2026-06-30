import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { listSubmissions } from "@/lib/submissions";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return new Response(JSON.stringify({ ok: false, error: "无权限" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const subs = await listSubmissions();
  const csv = toCsv(
    ["题目", "作者", "提交人邮箱", "文件", "状态", "提交时间"],
    subs.map((s) => [
      s.title, s.authors, s.user.email, s.fileUrl ?? "", s.status, s.createdAt.toISOString(),
    ]),
  );
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="submissions.csv"',
    },
  });
}
