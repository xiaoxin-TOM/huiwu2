import Link from "next/link";
import { getPublishedNotices } from "@/lib/content";

export default async function NoticesPage() {
  const notices = await getPublishedNotices();
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">会议通知</h1>
      {notices.length === 0 ? (
        <p className="text-gray-500">暂无通知。</p>
      ) : (
        <ul className="divide-y">
          {notices.map((n) => (
            <li key={n.id} className="py-3">
              <Link href={`/notices/${n.id}`} className="text-sky-700 hover:underline">
                {n.title}
              </Link>
              <span className="ml-3 text-sm text-gray-400">
                {n.publishedAt.toISOString().slice(0, 10)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
