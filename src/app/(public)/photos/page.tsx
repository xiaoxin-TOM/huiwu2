import Link from "next/link";
import { listAlbums } from "@/lib/albums";

export default async function PhotosPage() {
  const albums = await listAlbums();
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">图片直播</h1>
      {albums.length === 0 ? (
        <p className="text-gray-500">暂无相册。</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-3">
          {albums.map((a) => (
            <li key={a.id} className="rounded border">
              <Link href={`/photos/${a.id}`} className="block">
                {a.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.coverUrl} alt={a.title} className="h-40 w-full rounded-t object-cover" />
                )}
                <div className="p-3">
                  <h2 className="font-medium text-sky-700">{a.title}</h2>
                  <p className="text-sm text-gray-400">{a.date}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
