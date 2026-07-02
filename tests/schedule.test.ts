import { expect, test } from "vitest";
import { groupByDayAndRoom, type SessionWithSpeakers } from "@/lib/schedule";

function sess(p: Partial<SessionWithSpeakers>): SessionWithSpeakers {
  return {
    id: p.id ?? "x",
    day: p.day ?? "2026-09-18",
    startTime: p.startTime ?? "09:00",
    endTime: p.endTime ?? "10:00",
    room: p.room ?? "主会场",
    title: p.title ?? "场次",
    speakers: p.speakers ?? [],
  };
}

test("按天分组,天内按会场分组,会场内按开始时间", () => {
  const input = [
    sess({ id: "d2", day: "2026-09-19", room: "A", startTime: "09:00" }),
    sess({ id: "d1b", day: "2026-09-18", room: "B", startTime: "11:00" }),
    sess({ id: "d1a-late", day: "2026-09-18", room: "A", startTime: "14:00" }),
    sess({ id: "d1a-early", day: "2026-09-18", room: "A", startTime: "09:00" }),
  ];
  const grouped = groupByDayAndRoom(input);

  expect(grouped.map((g) => g.day)).toEqual(["2026-09-18", "2026-09-19"]);

  const day1 = grouped[0];
  expect(day1.rooms.map((r) => r.room)).toEqual(["A", "B"]);
  expect(day1.rooms[0].sessions.map((s) => s.id)).toEqual(["d1a-early", "d1a-late"]);

  const day2 = grouped[1];
  expect(day2.day).toBe("2026-09-19");
  expect(day2.rooms.map((r) => r.room)).toEqual(["A"]);
  expect(day2.rooms[0].sessions.map((s) => s.id)).toEqual(["d2"]);

  // day1 room B contains d1b
  expect(day1.rooms[1].room).toBe("B");
  expect(day1.rooms[1].sessions.map((s) => s.id)).toEqual(["d1b"]);
});

test("空输入返回空数组", () => {
  expect(groupByDayAndRoom([])).toEqual([]);
});
