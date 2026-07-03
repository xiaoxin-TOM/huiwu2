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
        <label className="block text-sm text-gray-600">会场名称
          <input name="venueName" defaultValue={cfg?.venueName ?? ""}
            className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm text-gray-600">会场地址
          <input name="venueAddress" defaultValue={cfg?.venueAddress ?? ""}
            className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-gray-600">会场经度
            <input name="venueLng" defaultValue={cfg?.venueLng ?? ""} placeholder="116.397"
              className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label className="block text-sm text-gray-600">会场纬度
            <input name="venueLat" defaultValue={cfg?.venueLat ?? ""} placeholder="39.909"
              className="mt-1 w-full rounded border px-3 py-2" />
          </label>
        </div>
        <p className="text-xs text-gray-400">
          坐标可在
          <a href="https://lbs.amap.com/tools/picker" target="_blank" rel="noreferrer"
            className="text-sky-700 underline">高德坐标拾取器</a>
          中点选复制(经纬度填写后前台会场交通页将显示地图与导航按钮)
        </p>
        <label className="block text-sm text-gray-600">欢迎致辞（纯文本，换行自动分段）
          <textarea name="welcomeHtml" rows={6} defaultValue={cfg?.welcomeHtml ?? ""}
            className="mt-1 w-full rounded border px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm text-gray-600">页脚内容（纯文本，每行一段）
          <textarea name="footerHtml" rows={4} defaultValue={cfg?.footerHtml ?? ""}
            className="mt-1 w-full rounded border px-3 py-2 text-sm" />
        </label>
        <button type="submit" className="rounded bg-sky-700 px-4 py-2 text-white">保存</button>
      </form>
    </div>
  );
}
