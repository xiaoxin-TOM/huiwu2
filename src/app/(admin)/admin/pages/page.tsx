import { listPages } from "@/lib/pages-admin";
import { listAllNotices } from "@/lib/notices-admin";
import { getCurrentMeeting } from "@/lib/meetings";
import { ButtonLink } from "@/components/ui/Button";
import AdminForm from "@/components/AdminForm";
import { BellIcon } from "@/components/icons";

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
  const [existing, notices] = await Promise.all([
    listPages(meeting.id),
    listAllNotices(meeting.id),
  ]);
  const bySlug = new Map(existing.map((p) => [p.slug, p]));

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">内容页管理</h1>
        <p className="text-sm text-gray-500">统一管理中心静态页、活动须知等富文本内容页，以及会议通知。</p>

        <section>
          <h2 className="mb-3 text-lg font-semibold">固定内容页</h2>
          <div className="space-y-3">
            {KNOWN.map((k) => {
              const page = bySlug.get(k.slug);
              return (
                <div key={k.slug} className="flex items-center justify-between rounded border bg-white p-4">
                  <div>
                    <h3 className="font-medium">{k.label}<span className="ml-2 text-xs text-gray-400">/{k.slug}</span></h3>
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
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">会议通知</h2>
            <ButtonLink href="/admin/pages/notices/new" variant="primary" size="sm">
              + 新建通知
            </ButtonLink>
          </div>

          {notices.length === 0 ? (
            <p className="text-gray-500">暂无通知。</p>
          ) : (
            <div className="overflow-x-auto rounded border bg-white">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="px-4 py-3">标题</th>
                    <th className="px-4 py-3">类型</th>
                    <th className="px-4 py-3">状态</th>
                    <th className="px-4 py-3">时间</th>
                    <th className="px-4 py-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {notices.map((n) => (
                    <tr key={n.id} className="border-b">
                      <td className="px-4 py-3 font-medium">{n.title}</td>
                      <td className="px-4 py-3">
                        {n.mode === "IMAGE" ? (
                          <span className="flex items-center gap-1 text-sky-700">
                            <BellIcon className="h-4 w-4" /> 一图流
                          </span>
                        ) : (
                          <span className="text-gray-500">富文本</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{n.isPublished ? "已发布" : "未发布"}</td>
                      <td className="px-4 py-3 text-gray-500">{n.publishedAt.toISOString().slice(0, 10)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <ButtonLink href={`/admin/pages/notices/${n.id}`} variant="secondary" size="xs">
                            编辑
                          </ButtonLink>
                          <AdminForm action={`/api/admin/notices/${n.id}/delete`} redirectTo="/admin/pages">
                            <button type="submit" className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100">
                              删除
                            </button>
                          </AdminForm>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
