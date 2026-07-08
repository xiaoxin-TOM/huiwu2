import { getPageBySlug } from "@/lib/pages-admin";
import { getCurrentMeeting } from "@/lib/meetings";
import AdminForm from "@/components/AdminForm";
import { ButtonLink } from "@/components/ui/Button";

const KNOWN: Record<string, string> = {
  venue: "会场交通",
  contact: "联系方式",
};

export default async function EditPagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meeting = await getCurrentMeeting();
  if (!meeting) {
    return (
      <div className="max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold">内容页管理</h1>
        <p className="text-red-600">未选择当前会议，请先到“会议管理”选择或创建一个会议。</p>
      </div>
    );
  }
  const page = await getPageBySlug(slug, meeting.id);
  const isNew = !page;
  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isNew ? "创建" : "编辑"}内容页：{KNOWN[slug] ?? slug}</h1>
        <ButtonLink href="/admin/pages" variant="secondary" size="sm">
          返回列表
        </ButtonLink>
      </div>
      <AdminForm action={`/api/admin/pages/${slug}`} redirectTo="/admin/pages" className="space-y-3 rounded border p-4">
        <label className="block text-sm text-gray-600">
          标题
          <input name="title" required defaultValue={page?.title ?? ""}
            className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm text-gray-600">
          正文（纯文本，换行自动分段）
          <textarea name="contentHtml" rows={12} defaultValue={page?.contentHtml ?? ""}
            className="mt-1 w-full rounded border px-3 py-2 text-sm" />
        </label>
        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800">
            保存
          </button>
          <ButtonLink href="/admin/pages" variant="secondary" size="sm">
            取消
          </ButtonLink>
        </div>
      </AdminForm>
    </div>
  );
}
