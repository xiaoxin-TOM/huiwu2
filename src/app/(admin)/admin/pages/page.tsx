import { listPages } from "@/lib/pages-admin";
import { getCurrentMeeting } from "@/lib/meetings";
import { ButtonLink } from "@/components/ui/Button";

const KNOWN: { slug: string; label: string }[] = [
  { slug: "intro", label: "活动简介" },
  { slug: "guide", label: "活动说明" },
  { slug: "notice", label: "活动须知" },
  { slug: "venue", label: "会场交通" },
  { slug: "contact", label: "联系方式" },
];

export default async function AdminPagesPage() {
  const meeting = await getCurrentMeeting();
  if (!meeting) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">内容页管理</h1>
        <p className="text-red-600">未选择当前会议，请先到“会议管理”选择或创建一个会议。</p>
      </div>
    );
  }
  const existing = await listPages(meeting.id);
  const bySlug = new Map(existing.map((p) => [p.slug, p]));
  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">内容页管理</h1>
        <p className="text-sm text-gray-500">编辑活动简介、活动说明、活动须知、会场交通、联系方式等富文本内容页。</p>
        <div className="space-y-3">
          {KNOWN.map((k) => {
            const page = bySlug.get(k.slug);
            return (
              <div key={k.slug} className="flex items-center justify-between rounded border p-4">
                <div>
                  <h2 className="font-medium">{k.label}<span className="ml-2 text-xs text-gray-400">/{k.slug}</span></h2>
                  <p className="text-sm text-gray-500">
                    {page ? `标题：${page.title}` : "尚未创建，点击编辑可初始化内容"}
                  </p>
                </div>
                <ButtonLink href={`/admin/pages/${k.slug}`} variant="primary" size="sm">
                  {page ? "编辑" : "创建"}
                </ButtonLink>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
