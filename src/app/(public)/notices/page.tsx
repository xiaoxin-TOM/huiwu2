import { getPublishedNotices } from "@/lib/content";
import { DataCard } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { BellIcon } from "@/components/icons";

export default async function NoticesPage() {
  const notices = await getPublishedNotices();
  return (
    <div className="space-y-4">
      <PageHeader title="会议通知" />
      {notices.length === 0 ? (
        <p className="text-slate-500">暂无通知。</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {notices.map((n) => (
            <DataCard
              key={n.id}
              href={`/notices/${n.id}`}
              title={n.title}
              meta={n.publishedAt.toISOString().slice(0, 10)}
              icon={<BellIcon className="h-6 w-6" />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
