import { listAlbumsAdmin } from "@/lib/albums";

export default async function AdminAlbumsPage() {
  const albums = await listAlbumsAdmin();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">图片直播管理</h1>

      <form action="/api/admin/albums" method="post" className="flex flex-wrap items-end gap-2 rounded border p-4">
        <label className="text-sm text-gray-500">标题
          <input name="title" required className="mt-1 block rounded border px-3 py-1.5" />
        </label>
        <label className="text-sm text-gray-500">日期
          <input name="date" type="date" required className="mt-1 block rounded border px-3 py-1.5" />
        </label>
        <button type="submit" className="rounded bg-sky-700 px-3 py-1.5 text-sm text-white">新建相册</button>
      </form>

      {albums.length === 0 ? (
        <p className="text-gray-500">暂无相册。</p>
      ) : (
        albums.map((a) => (
          <div key={a.id} className="space-y-3 rounded border p-4">
            <div className="flex items-baseline gap-3">
              <h2 className="font-medium">{a.title}</h2>
              <span className="text-sm text-gray-400">{a.date}</span>
            </div>

            <form action={`/api/admin/albums/${a.id}/photos`} method="post"
              encType="multipart/form-data" className="flex flex-wrap items-center gap-2">
              <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required className="text-sm" />
              <input name="caption" placeholder="说明(可选)" className="rounded border px-2 py-1 text-sm" />
              <button type="submit" className="rounded bg-green-600 px-2 py-1 text-xs text-white">上传照片</button>
            </form>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {a.photos.map((p) => (
                <div key={p.id} className="space-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.caption} className="h-24 w-full rounded object-cover" />
                  <form action={`/api/admin/photos/${p.id}/delete`} method="post">
                    <button type="submit" className="w-full rounded bg-red-600 px-1 py-0.5 text-xs text-white">删除</button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
