import Link from "next/link";
import { listPages } from "@/lib/pages-admin";
import { getSiteConfig } from "@/lib/siteconfig";

const KNOWN: { slug: string; label: string }[] = [
  { slug: "venue", label: "会场交通" },
  { slug: "contact", label: "联系方式" },
];

export default async function AdminPagesPage() {
  const existing = await listPages();
  const bySlug = new Map(existing.map((p) => [p.slug, p]));
  const cfg = await getSiteConfig();
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

      <div className="space-y-4 rounded border p-4">
        <div>
          <h2 className="text-lg font-bold">脚页内容</h2>
          <p className="text-sm text-gray-500">管理首页底部版权、技术支持等文字。纯文本，每行一段。</p>
        </div>
        <form action="/api/admin/site" method="post" className="space-y-3">
          <textarea
            name="footerHtml"
            rows={5}
            defaultValue={cfg?.footerHtml ?? ""}
            placeholder="例如：\n© 2026 会务管理系统 · All rights reserved.\n中国医院协会 版权所有\n技术支持由位值科技有限公司提供"
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <input type="hidden" name="confName" value={cfg?.confName ?? "会务管理系统"} />
          <input type="hidden" name="confDate" value={cfg?.confDate ?? ""} />
          <input type="hidden" name="confLocation" value={cfg?.confLocation ?? ""} />
          <input type="hidden" name="logoUrl" value={cfg?.logoUrl ?? ""} />
          <input type="hidden" name="liveUrl" value={cfg?.liveUrl ?? ""} />
          <input type="hidden" name="welcomeHtml" value={cfg?.welcomeHtml ?? ""} />
          <input type="hidden" name="redirectTo" value="/admin/pages" />
          <button type="submit" className="rounded bg-sky-700 px-4 py-2 text-sm text-white hover:bg-sky-800">保存脚页内容</button>
        </form>
      </div>
    </div>
  );
}
