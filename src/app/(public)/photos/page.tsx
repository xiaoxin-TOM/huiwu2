import { listAlbums } from "@/lib/albums";
import { DataCard } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ImageIcon } from "@/components/icons";

export default async function PhotosPage() {
  const albums = await listAlbums();
  return (
    <div className="space-y-4">
      <PageHeader title="图片直播" />
      {albums.length === 0 ? (
        <p className="text-slate-500">暂无相册。</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <DataCard
              key={a.id}
              href={`/photos/${a.id}`}
              title={a.title}
              meta={a.date}
              imageUrl={a.coverUrl}
              icon={<ImageIcon className="h-6 w-6" />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
