import { requireUser } from "@/lib/session";
import { resolveMeeting } from "@/lib/meetings";
import { listUserNotifications } from "@/lib/notifications";
import { meetingHref } from "@/lib/public";
import { PageHeader } from "@/components/ui/PageHeader";
import NotificationList from "@/components/NotificationList";

function formatTime(d: Date): string {
  return d.toISOString().slice(0, 16).replace("T", " ");
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const user = await requireUser();
  const meeting = await resolveMeeting((await searchParams).m);
  const notifications = await listUserNotifications(user.id, meeting.id);

  return (
    <div className="space-y-4">
      <PageHeader title="我的通知" backHref={meetingHref(meeting.id, "/me")} />
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
    </div>
  );
}
