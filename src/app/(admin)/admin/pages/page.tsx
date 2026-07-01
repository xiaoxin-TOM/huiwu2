import { listPages } from "@/lib/pages-admin";

const KNOWN: { slug: string; label: string }[] = [
  { slug: "venue", label: "会场交通" },
  { slug: "contact", label: "联系方式" },
];

export default async function AdminPagesPage() {
  const existing = await listPages();
  const bySlug = new Map(existing.map((p) => [p.slug, p]));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">内容页管理</h1>
      <p className="text-sm text-gray-500">编辑会场交通、联系方式等富文本内容页。</p>
      {KNOWN.map((k) => {
        const page = bySlug.get(k.slug);
        return (
          <form key={k.slug} action={`/api/admin/pages/${k.slug}`} method="post"
            className="space-y-2 rounded border p-4">
            <h2 className="font-medium">{k.label}<span className="ml-2 text-xs text-gray-400">/{k.slug}</span></h2>
            <input name="title" required defaultValue={page?.title ?? k.label}
              className="w-full rounded border px-3 py-2" placeholder="标题" />
            <textarea name="contentHtml" rows={6} defaultValue={page?.contentHtml ?? ""}
              className="w-full rounded border px-3 py-2 font-mono text-sm" placeholder="正文(HTML)" />
            <button type="submit" className="rounded bg-sky-700 px-4 py-2 text-sm text-white">保存</button>
          </form>
        );
      })}
    </div>
  );
}
