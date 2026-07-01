import { getSiteConfig } from "@/lib/siteconfig";

export default async function AdminSitePage() {
  const cfg = await getSiteConfig();
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">站点设置</h1>
      <form action="/api/admin/site" method="post" className="space-y-3">
        <label className="block text-sm text-gray-600">会议名称
          <input name="confName" required defaultValue={cfg?.confName ?? ""}
            className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm text-gray-600">会议时间
          <input name="confDate" defaultValue={cfg?.confDate ?? ""}
            className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm text-gray-600">会议地点
          <input name="confLocation" defaultValue={cfg?.confLocation ?? ""}
            className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm text-gray-600">Logo 图片地址
          <input name="logoUrl" defaultValue={cfg?.logoUrl ?? ""}
            className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm text-gray-600">直播地址(外部链接)
          <input name="liveUrl" defaultValue={cfg?.liveUrl ?? ""}
            className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm text-gray-600">欢迎致辞（纯文本，换行自动分段）
          <textarea name="welcomeHtml" rows={6} defaultValue={cfg?.welcomeHtml ?? ""}
            className="mt-1 w-full rounded border px-3 py-2 text-sm" />
        </label>
        <button type="submit" className="rounded bg-sky-700 px-4 py-2 text-white">保存</button>
      </form>
    </div>
  );
}
