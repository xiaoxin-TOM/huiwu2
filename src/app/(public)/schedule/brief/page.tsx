import { getBriefSessions } from "@/lib/schedule";

export default async function BriefSchedulePage() {
  const sessions = await getBriefSessions();
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">简明日程</h1>
      {sessions.length === 0 ? (
        <p className="text-gray-500">日程待发布。</p>
      ) : (
        <ul className="divide-y">
          {sessions.map((s) => (
            <li key={s.id} className="flex gap-4 py-2 text-sm">
              <span className="w-44 shrink-0 text-gray-500">
                {s.day} {s.startTime}–{s.endTime}
              </span>
              <span className="font-medium">{s.title}</span>
              <span className="ml-auto text-gray-400">{s.room}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
