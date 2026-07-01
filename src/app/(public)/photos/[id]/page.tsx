import { notFound } from "next/navigation";
import { getAlbum } from "@/lib/albums";

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const album = await getAlbum(id);
  if (!album) notFound();
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{album.title}</h1>
      <p className="text-sm text-gray-400">{album.date}</p>
      {album.photos.length === 0 ? (
        <p className="text-gray-500">该相册暂无照片。</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {album.photos.map((p) => (
            <figure key={p.id} className="space-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.caption} className="w-full rounded object-cover" />
              {p.caption && <figcaption className="text-xs text-gray-500">{p.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
