import { notFound } from "next/navigation";
import { getAlbum } from "@/lib/albums";
import { resolveMeeting } from "@/lib/meetings";
import { meetingHref } from "@/lib/public";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function AlbumPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const { id } = await params;
  const meeting = await resolveMeeting((await searchParams).m);
  const album = await getAlbum(id, meeting.id);
  if (!album) notFound();

  return (
    <div className="space-y-4">
      <PageHeader title={album.title} subtitle={album.date} backHref={meetingHref(meeting.id, "/photos")} />
      {album.photos.length === 0 ? (
        <p className="text-slate-500">该相册暂无照片。</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {album.photos.map((p) => (
            <figure key={p.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.caption} className="aspect-square w-full object-cover" />
              {p.caption && <figcaption className="p-2 text-xs text-slate-500">{p.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
