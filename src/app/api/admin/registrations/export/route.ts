import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { listRegistrations } from "@/lib/registrations";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return new Response(JSON.stringify({ ok: false, error: "无权限" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const regs = await listRegistrations();
  const csv = toCsv(
    ["姓名", "邮箱", "参会类型", "单位", "职称", "电话", "状态", "提交时间"],
    regs.map((r) => [
      r.fullName, r.user.email, r.type.name, r.organization, r.title, r.phone, r.status,
      r.createdAt.toISOString(),
    ]),
  );
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="registrations.csv"',
    },
  });
}
