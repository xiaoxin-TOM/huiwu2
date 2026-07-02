import Link from "next/link";
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
              <Link
                href={`/admin/pages/${k.slug}`}
                className="rounded bg-sky-700 px-4 py-2 text-sm text-white hover:bg-sky-800"
              >
                {page ? "编辑" : "创建"}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
