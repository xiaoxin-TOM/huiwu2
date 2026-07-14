import { prisma } from "@/lib/prisma";
import type { Session, SessionSpeaker, Speaker } from "@prisma/client";

export type SessionWithSpeakers = Session & {
  speakers: (SessionSpeaker & { speaker: Speaker })[];
};

export type DayGroup = {
  day: string;
  rooms: { room: string; sessions: SessionWithSpeakers[] }[];
};

export function groupByDayAndRoom(sessions: SessionWithSpeakers[]): DayGroup[] {
  const sorted = [...sessions].sort(
    (a, b) =>
      String(a.day ?? "").localeCompare(String(b.day ?? "")) ||
      String(a.room ?? "").localeCompare(String(b.room ?? "")) ||
      String(a.startTime ?? "").localeCompare(String(b.startTime ?? "")),
  );
  const days: DayGroup[] = [];
  for (const s of sorted) {
    let day = days.find((d) => d.day === s.day);
    if (!day) {
      day = { day: s.day, rooms: [] };
      days.push(day);
    }
    let room = day.rooms.find((r) => r.room === s.room);
    if (!room) {
      room = { room: s.room, sessions: [] };
      day.rooms.push(room);
    }
    room.sessions.push(s);
  }
  return days;
}

const include = { speakers: { include: { speaker: true } } } as const;

export function getDetailedSessions(meetingId: string): Promise<SessionWithSpeakers[]> {
  return prisma.session.findMany({
    where: { meetingId },
    include,
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  });
}
