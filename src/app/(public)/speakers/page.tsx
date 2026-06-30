import Link from "next/link";
import { getAllSpeakers, filterSpeakers } from "@/lib/speakers";

export default async function SpeakersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const speakers = filterSpeakers(await getAllSpeakers(), q);
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">讲者查询</h1>
      <form className="flex gap-2" action="/speakers" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="按姓名或单位搜索"
          className="rounded border px-3 py-1.5 text-sm"
        />
        <button type="submit" className="rounded bg-sky-700 px-3 py-1.5 text-sm text-white">
          搜索
        </button>
      </form>
      {speakers.length === 0 ? (
        <p className="text-gray-500">未找到匹配的讲者。</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {speakers.map((s) => (
            <li key={s.id} className="rounded border p-4">
              <Link href={`/speakers/${s.id}`} className="font-medium text-sky-700 hover:underline">
                {s.name}
              </Link>
              {s.isModerator && (
                <span className="ml-2 rounded bg-amber-100 px-1.5 text-xs text-amber-700">主持人</span>
              )}
              <p className="text-sm text-gray-500">{s.title} · {s.organization}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
