import { auth } from "@/lib/auth";
import { requireCurrentMeeting } from "@/lib/meetings";
import { listUserNotifications } from "@/lib/notifications";
import { listDeliveries, countFailedDeliveries } from "@/lib/notification-delivery";
import NotificationList from "@/components/NotificationList";
import DeliveryRetryButtons from "@/components/DeliveryRetryButtons";

function formatTime(d: Date | null): string {
  return d ? d.toISOString().slice(0, 16).replace("T", " ") : "-";
}

const DELIVERY_STATUS_LABEL: Record<string, string> = {
  PENDING: "待发送",
  SENT: "已发送",
  FAILED: "发送失败",
};

const DELIVERY_STATUS_STYLE: Record<string, string> = {
  PENDING: "text-slate-500",
  SENT: "text-emerald-700",
  FAILED: "text-red-600",
};

export default async function AdminNotificationsPage() {
  const meeting = await requireCurrentMeeting();
  const session = await auth();
  const userId = session?.user?.id ?? "";

  const [notifications, deliveries, failedCount] = await Promise.all([
    listUserNotifications(userId, meeting.id),
    listDeliveries(),
    countFailedDeliveries(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">通知中心</h1>
        <p className="text-sm text-gray-500">当前会议：{meeting.title}</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-medium">我的待办通知</h2>
        <NotificationList
          markAllHref={`/api/notifications/read-all?m=${meeting.id}`}
          notifications={notifications.map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            linkHref: n.linkHref,
            isRead: n.readAt !== null,
            createdAt: formatTime(n.createdAt),
          }))}
        />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-medium">
            邮件发送记录
            {failedCount > 0 && (
              <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                {failedCount} 封失败
              </span>
            )}
          </h2>
          <DeliveryRetryButtons hasFailed={failedCount > 0} />
        </div>

        {deliveries.length === 0 ? (
          <p className="text-sm text-gray-500">暂无邮件记录。</p>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="px-4 py-3">收件人</th>
                  <th className="px-4 py-3">主题</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">尝试</th>
                  <th className="px-4 py-3">时间</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id} className="border-b">
                    <td className="px-4 py-3">{d.toAddress}</td>
                    <td className="px-4 py-3">
                      <span className="block max-w-[20rem] truncate">{d.subject}</span>
                      {d.lastError && (
                        <span className="block max-w-[20rem] truncate text-xs text-red-500">{d.lastError}</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 ${DELIVERY_STATUS_STYLE[d.status] ?? ""}`}>
                      {DELIVERY_STATUS_LABEL[d.status] ?? d.status}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{d.attempts}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {d.status === "SENT" ? formatTime(d.sentAt) : formatTime(d.nextAttemptAt)}
                    </td>
                    <td className="px-4 py-3">
                      {d.status !== "SENT" && <DeliveryRetryButtons deliveryId={d.id} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
