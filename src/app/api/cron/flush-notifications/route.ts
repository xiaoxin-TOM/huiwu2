import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { flushNotificationDeliveries } from "@/lib/notification-delivery";

function secretMatches(provided: string | null): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * 邮件队列的驱动入口，由服务器 crontab 定时调用：
 *   * * * * * curl -s -X POST -H "x-cron-secret: xxx" http://localhost:3003/api/cron/flush-notifications
 */
export async function POST(req: Request) {
  if (!process.env.CRON_SECRET) {
    console.error("[cron flush] CRON_SECRET 未配置，拒绝执行");
    return NextResponse.json({ ok: false, error: "未配置" }, { status: 503 });
  }
  if (!secretMatches(req.headers.get("x-cron-secret"))) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }

  try {
    const result = await flushNotificationDeliveries();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron flush] error:", error);
    return NextResponse.json({ ok: false, error: "刷新失败" }, { status: 500 });
  }
}
