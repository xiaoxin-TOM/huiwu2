import { listPages } from "@/lib/pages-admin";
import { getCurrentMeeting } from "@/lib/meetings";
import AdminForm from "@/components/AdminForm";
import { ButtonLink } from "@/components/ui/Button";

const KNOWN: { slug: string; label: string }[] = [
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
        <p className="text-sm text-gray-500">编辑会场交通、联系方式等富文本内容页。</p>
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

      <div className="space-y-4 rounded border p-4">
        <div>
          <h2 className="text-lg font-bold">脚页内容</h2>
          <p className="text-sm text-gray-500">管理当前会议底部版权、技术支持等文字。纯文本，每行一段。</p>
        </div>
        <AdminForm action="/api/admin/site" redirectTo="/admin/pages" className="space-y-3">
          <textarea
            name="footerHtml"
            rows={5}
            defaultValue={meeting.footerHtml ?? ""}
            placeholder="例如：\n© 2026 会务管理系统 · All rights reserved.\n中国医院协会 版权所有\n技术支持由位值科技有限公司提供"
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <input type="hidden" name="confName" value={meeting.title} />
          <input type="hidden" name="confDate" value={meeting.confDate ?? ""} />
          <input type="hidden" name="confLocation" value={meeting.location ?? ""} />
          <input type="hidden" name="logoUrl" value={meeting.logoUrl ?? ""} />
          <input type="hidden" name="liveUrl" value={meeting.liveUrl ?? ""} />
          <input type="hidden" name="welcomeHtml" value={meeting.welcomeHtml ?? ""} />
          <input type="hidden" name="redirectTo" value="/admin/pages" />
          <button type="submit" className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800">
            保存脚页内容
          </button>
        </AdminForm>
      </div>
    </div>
  );
}
