import { getDetailedSessions, groupByDayAndRoom } from "@/lib/schedule";

export default async function SchedulePage() {
  const grouped = groupByDayAndRoom(await getDetailedSessions());
  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-bold">详细日程</h1>
      {grouped.length === 0 ? (
        <p className="text-gray-500">日程待发布。</p>
      ) : (
        grouped.map((day) => (
          <div key={day.day} className="space-y-4">
            <h2 className="text-lg font-semibold text-sky-700">{day.day}</h2>
            {day.rooms.map((room) => (
              <div key={room.room} className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">{room.room}</h3>
                <ul className="divide-y rounded border">
                  {room.sessions.map((s) => {
                    const speakers = s.speakers
                      .filter((x) => x.role === "SPEAKER")
                      .map((x) => x.speaker.name);
                    const moderators = s.speakers
                      .filter((x) => x.role === "MODERATOR")
                      .map((x) => x.speaker.name);
                    return (
                      <li key={s.id} className="space-y-1 px-3 py-2">
                        <div className="flex gap-3 text-sm">
                          <span className="w-28 shrink-0 text-gray-500">
                            {s.startTime}–{s.endTime}
                          </span>
                          <span className="font-medium">{s.title}</span>
                        </div>
                        {speakers.length > 0 && (
                          <p className="pl-28 text-xs text-gray-500">讲者:{speakers.join("、")}</p>
                        )}
                        {moderators.length > 0 && (
                          <p className="pl-28 text-xs text-gray-500">主持:{moderators.join("、")}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ))
      )}
    </section>
  );
}
