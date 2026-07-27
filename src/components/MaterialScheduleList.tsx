import Link from "next/link";
import type { DayMaterialGroup } from "@/lib/speaker-materials";

/**
 * 按 日期 → 会场 → 日程 展示材料目录。
 * 参会文件页与汇报链接的章程页共用这个结构，只是详情链接前缀不同。
 */
export default function MaterialScheduleList({
  days,
  hrefForSession,
  emptyHint = "暂无可查看的资料。",
}: {
  days: DayMaterialGroup[];
  hrefForSession: (sessionId: string) => string;
  emptyHint?: string;
}) {
  if (days.length === 0) {
    return <p className="text-sm text-slate-500">{emptyHint}</p>;
  }

  return (
    <div className="space-y-6">
      {days.map((day) => (
        <section key={day.day} className="space-y-3">
          <h2 className="text-lg font-bold text-slate-800">{day.day}</h2>
          {day.rooms.map((room) => (
            <div key={`${day.day}-${room.room}`} className="space-y-2">
              {room.room && <h3 className="text-sm font-medium text-slate-500">{room.room}</h3>}
              <div className="divide-y rounded-xl bg-white shadow-sm">
                {room.sessions.map((s) => (
                  <div key={s.sessionId} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">
                        <span className="mr-2 text-sm text-sky-700">
                          {s.startTime}-{s.endTime}
                        </span>
                        {s.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {s.speakers.join("、")} · {s.materials.length} 个文件
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {s.materials.map((m) => (
                          <li key={m.id} className="truncate text-xs text-slate-500">
                            📄 {m.fileName}
                            {m.isConfidential && (
                              <span className="ml-1 rounded bg-amber-100 px-1 text-amber-800">保密</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      href={hrefForSession(s.sessionId)}
                      className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800"
                    >
                      进入
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
