import { listAlbumsAdmin } from "@/lib/albums";
import { getCurrentMeeting } from "@/lib/meetings";
import AlbumPhotoUpload from "@/components/AlbumPhotoUpload";
import DeleteAlbumButton from "@/components/DeleteAlbumButton";
import AdminForm from "@/components/AdminForm";
import { PlusIcon, TrashIcon } from "@/components/icons";

function formatAlbumTime(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return "";
  const parse = (s: string) => {
    const [date, time] = s.split("T");
    const [y, m, d] = date.split("-");
    const [h] = time.split(":");
    return `${y}-${m}-${Number(d)} ${Number(h)}时`;
  };
  return `${parse(startTime)}至${parse(endTime)}`;
}

export default async function AdminAlbumsPage() {
  const meeting = await getCurrentMeeting();
  if (!meeting) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-admin-text">直播图片</h1>
        <p className="text-red-600">未选择当前会议，请先到“会议管理”选择或创建一个会议。</p>
      </div>
    );
  }
  const albums = await listAlbumsAdmin(meeting.id);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-admin-text">直播图片</h1>
      </div>

      <AdminForm
        action="/api/admin/albums"
        redirectTo="/admin/albums"
        confirmMessage="相册信息一经创建将不可修改，请您认真核对信息后在点击确定"
        className="rounded-xl bg-white p-5 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-800">新建相册</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-sm text-slate-600">
            标题
            <input
              name="title"
              required
              className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <label className="block text-sm text-slate-600">
            产生时间（起）
            <input
              name="startTime"
              type="datetime-local"
              required
              className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <label className="block text-sm text-slate-600">
            产生时间（止）
            <input
              name="endTime"
              type="datetime-local"
              required
              className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <label className="block text-sm text-slate-600">
            备注
            <input
              name="note"
              placeholder="相册说明"
              className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
          >
            <PlusIcon className="h-4 w-4" />
            新建相册
          </button>
        </div>
      </AdminForm>

      {albums.length === 0 ? (
        <p className="text-slate-500">暂无相册。</p>
      ) : (
        albums.map((a) => (
          <div key={a.id} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-baseline gap-3">
                <h2 className="text-lg font-semibold text-slate-800">{a.title}</h2>
                {a.startTime && a.endTime && (
                  <span className="text-sm text-slate-400">{formatAlbumTime(a.startTime, a.endTime)}</span>
                )}
              </div>
              <DeleteAlbumButton albumId={a.id} albumTitle={a.title} />
            </div>

            {a.note && (
              <div className="mb-3 text-sm text-slate-600">
                <p>备注：{a.note}</p>
              </div>
            )}

            <AlbumPhotoUpload albumId={a.id} />

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
              {a.photos.map((p) => (
                <div key={p.id} className="group space-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={p.caption}
                    className="h-24 w-full rounded-lg object-cover"
                  />
                  <AdminForm action={`/api/admin/photos/${p.id}/delete`} redirectTo="/admin/albums">
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-1 rounded-lg bg-red-50 px-1 py-1 text-xs font-medium text-red-600 transition hover:bg-red-100"
                    >
                      <TrashIcon className="h-3 w-3" />
                      删除
                    </button>
                  </AdminForm>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
