import { expect, test } from "vitest";
import {
  groupTablesByArea,
  tableOccupancy,
  findMySeat,
  describeSeat,
  type SeatTableLike,
  type SeatAssignmentLike,
} from "@/lib/seating";

function assignment(over: Partial<SeatAssignmentLike> = {}): SeatAssignmentLike {
  return { id: "a1", seatTableId: "t1", registrationId: null, guestId: null, seatNo: null, name: "某人", ...over };
}

function table(over: Partial<SeatTableLike> = {}): SeatTableLike {
  return { id: "t1", name: "1 号桌", capacity: 10, area: "主宴会厅", assignments: [], ...over };
}

test("按分区分组，无分区的归到未分区且排在最后", () => {
  const groups = groupTablesByArea([
    table({ id: "t2", name: "2 号桌", area: "" }),
    table({ id: "t1", name: "1 号桌", area: "主宴会厅" }),
    table({ id: "t3", name: "3 号桌", area: "主宴会厅" }),
  ]);
  expect(groups.map((g) => g.area)).toEqual(["主宴会厅", ""]);
  expect(groups[0].tables.map((t) => t.name)).toEqual(["1 号桌", "3 号桌"]);
});

test("分组对空输入返回空数组", () => {
  expect(groupTablesByArea([])).toEqual([]);
});

test("占用统计给出已排与余位", () => {
  const t = table({ capacity: 10, assignments: [assignment(), assignment({ id: "a2" })] });
  expect(tableOccupancy(t)).toEqual({ seated: 2, capacity: 10, remaining: 8, isFull: false });
});

test("超额排座时余位为 0 而非负数，并标记已满", () => {
  const t = table({
    capacity: 2,
    assignments: [assignment(), assignment({ id: "a2" }), assignment({ id: "a3" })],
  });
  expect(tableOccupancy(t)).toEqual({ seated: 3, capacity: 2, remaining: 0, isFull: true });
});

test("容量恰好排满时标记已满", () => {
  const t = table({ capacity: 1, assignments: [assignment()] });
  expect(tableOccupancy(t).isFull).toBe(true);
});

test("按报名 id 找到自己的座位与同桌人", () => {
  const tables = [
    table({
      id: "t1",
      name: "1 号桌",
      assignments: [
        assignment({ id: "a1", registrationId: "r1", name: "我", seatNo: 3 }),
        assignment({ id: "a2", registrationId: "r2", name: "同桌甲" }),
        assignment({ id: "a3", guestId: "g1", name: "同桌乙" }),
      ],
    }),
    table({ id: "t2", name: "2 号桌", assignments: [assignment({ id: "a4", registrationId: "r9", name: "别桌" })] }),
  ];

  const found = findMySeat(tables, { registrationId: "r1", guestId: null });
  expect(found?.table.name).toBe("1 号桌");
  expect(found?.mine.seatNo).toBe(3);
  expect(found?.tableMates.map((m) => m.name)).toEqual(["同桌甲", "同桌乙"]);
});

test("按嘉宾 id 也能找到座位", () => {
  const tables = [table({ assignments: [assignment({ id: "a1", guestId: "g5", name: "嘉宾" })] })];
  expect(findMySeat(tables, { registrationId: null, guestId: "g5" })?.mine.name).toBe("嘉宾");
});

test("未排座返回 null，两个身份都为空也返回 null", () => {
  const tables = [table({ assignments: [assignment({ registrationId: "r1" })] })];
  expect(findMySeat(tables, { registrationId: "r-none", guestId: null })).toBeNull();
  expect(findMySeat(tables, { registrationId: null, guestId: null })).toBeNull();
});

test("null 身份不会误匹配到 registrationId 为 null 的记录", () => {
  // 手工建的占位记录两个 id 都为空时，不该被任何人认领
  const tables = [table({ assignments: [assignment({ registrationId: null, guestId: null, name: "占位" })] })];
  expect(findMySeat(tables, { registrationId: null, guestId: null })).toBeNull();
});

test("座位描述：有座次显示桌号加座次，无座次只显示桌号", () => {
  expect(describeSeat({ tableName: "3 号桌", seatNo: 7 })).toBe("3 号桌 · 7 号座");
  expect(describeSeat({ tableName: "3 号桌", seatNo: null })).toBe("3 号桌");
});
