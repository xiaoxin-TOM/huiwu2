import Link from "next/link";
import { getPage } from "@/lib/pages-admin";
import AdminForm from "@/components/AdminForm";

const KNOWN: Record<string, string> = {
  venue: "会场交通",
  contact: "联系方式",
};

export default async function EditPagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPage(slug);
  const isNew = !page;
  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isNew ? "创建" : "编辑"}内容页：{KNOWN[slug] ?? slug}</h1>
        <Link href="/admin/pages" className="text-sm text-sky-700 hover:underline">返回列表</Link>
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
        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded bg-sky-700 px-4 py-2 text-white">保存</button>
          <Link href="/admin/pages" className="rounded border px-4 py-2 text-sm hover:bg-gray-50">取消</Link>
        </div>
      </AdminForm>
    </div>
  );
}
