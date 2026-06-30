import { notFound } from "next/navigation";
import { getNotice } from "@/lib/notices-admin";

export default async function EditNoticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notice = await getNotice(id);
  if (!notice) notFound();
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">编辑通知</h1>
      <form action={`/api/admin/notices/${notice.id}`} method="post" className="space-y-3">
        <input name="title" required defaultValue={notice.title}
          className="w-full rounded border px-3 py-2" />
        <textarea name="contentHtml" rows={8} defaultValue={notice.contentHtml}
          className="w-full rounded border px-3 py-2 font-mono text-sm" />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" name="isPublished" defaultChecked={notice.isPublished} /> 已发布
        </label>
        <button type="submit" className="rounded bg-sky-700 px-4 py-2 text-white">保存</button>
      </form>
    </div>
  );
}
