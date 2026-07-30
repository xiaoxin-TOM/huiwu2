/**
 * 排座的纯逻辑——不碰数据库与 Next 运行时，可完整单测。
 */

export type SeatAssignmentLike = {
  id: string;
  seatTableId: string;
  registrationId: string | null;
  guestId: string | null;
  seatNo: number | null;
  name: string;
};

/** assignments 参数化，调用方带的额外字段（单位、类型等）能透传到返回值 */
export type SeatTableLike<A extends SeatAssignmentLike = SeatAssignmentLike> = {
  id: string;
  name: string;
  capacity: number;
  area: string;
  assignments: A[];
};

export type SeatAreaGroup<T> = { area: string; tables: T[] };

/** 按分区分组；未填分区的归到末尾的空分区 */
export function groupTablesByArea<T extends SeatTableLike>(tables: T[]): SeatAreaGroup<T>[] {
  const groups: SeatAreaGroup<T>[] = [];
  for (const t of tables) {
    let group = groups.find((g) => g.area === t.area);
    if (!group) {
      group = { area: t.area, tables: [] };
      groups.push(group);
    }
    group.tables.push(t);
  }
  // 空分区排最后，其余保持原有顺序（调用方已按 sortOrder 取出）
  return groups.sort((a, b) => (a.area === "" ? 1 : 0) - (b.area === "" ? 1 : 0));
}

export type Occupancy = { seated: number; capacity: number; remaining: number; isFull: boolean };

export function tableOccupancy(table: Pick<SeatTableLike, "capacity" | "assignments">): Occupancy {
  const seated = table.assignments.length;
  return {
    seated,
    capacity: table.capacity,
    // 超额排座时不返回负数，避免界面出现"余 -1 位"
    remaining: Math.max(0, table.capacity - seated),
    isFull: seated >= table.capacity,
  };
}

export type MySeat<T extends SeatTableLike> = {
  table: T;
  mine: T["assignments"][number];
  tableMates: T["assignments"][number][];
};

/**
 * 找出某人的座位。
 * 两个身份都为空时直接返回 null——否则会误匹配到 id 均为空的占位记录。
 */
export function findMySeat<T extends SeatTableLike>(
  tables: T[],
  who: { registrationId: string | null; guestId: string | null },
): MySeat<T> | null {
  if (!who.registrationId && !who.guestId) return null;

  for (const table of tables) {
    const mine = table.assignments.find(
      (a) =>
        (who.registrationId !== null && a.registrationId === who.registrationId) ||
        (who.guestId !== null && a.guestId === who.guestId),
    );
    if (mine) {
      return {
        table,
        mine,
        tableMates: table.assignments.filter((a) => a.id !== mine.id),
      };
    }
  }
  return null;
}

export function describeSeat(seat: { tableName: string; seatNo: number | null }): string {
  return seat.seatNo ? `${seat.tableName} · ${seat.seatNo} 号座` : seat.tableName;
}
