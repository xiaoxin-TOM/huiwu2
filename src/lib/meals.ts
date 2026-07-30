/**
 * 用餐管理的纯逻辑——不碰数据库与 Next 运行时，可完整单测。
 */

export const MEAL_SLOTS = ["BREAKFAST", "LUNCH", "DINNER"] as const;

export type MealSlot = (typeof MEAL_SLOTS)[number];

export const MEAL_SLOT_LABEL: Record<string, string> = {
  BREAKFAST: "早餐",
  LUNCH: "午餐",
  DINNER: "晚餐",
};

/** 同一天内的展示顺序 */
const SLOT_ORDER: Record<string, number> = { BREAKFAST: 0, LUNCH: 1, DINNER: 2 };

export type MealSessionLike = {
  id: string;
  day: string;
  slot: string;
  name: string;
  venue: string;
  startTime: string;
  endTime: string;
  typeIds: string[];
};

/** 把任意来源的 typeIds 归一化：去空、去重、只留字符串 */
export function normalizeTypeIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const v of raw) {
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    if (!trimmed || out.includes(trimmed)) continue;
    out.push(trimmed);
  }
  return out;
}

/**
 * 某参会类型是否可用该餐次。
 * typeIds 为空表示不限——这样新增一个参会类型不必回头补每个餐次的配置。
 */
export function isEligibleForMeal(
  meal: Pick<MealSessionLike, "typeIds">,
  registrationTypeId: string | null | undefined,
): boolean {
  const allowed = normalizeTypeIds(meal.typeIds);
  if (allowed.length === 0) return true;
  if (!registrationTypeId) return false;
  return allowed.includes(registrationTypeId);
}

export type MealDayGroup<T extends MealSessionLike> = { day: string; meals: T[] };

/** 按日期分组，同日内按早/中/晚排序 */
export function groupMealsByDay<T extends MealSessionLike>(meals: T[]): MealDayGroup<T>[] {
  const days: MealDayGroup<T>[] = [];
  const sorted = [...meals].sort(
    (a, b) =>
      a.day.localeCompare(b.day) ||
      (SLOT_ORDER[a.slot] ?? 99) - (SLOT_ORDER[b.slot] ?? 99) ||
      a.startTime.localeCompare(b.startTime),
  );
  for (const m of sorted) {
    let group = days.find((d) => d.day === m.day);
    if (!group) {
      group = { day: m.day, meals: [] };
      days.push(group);
    }
    group.meals.push(m);
  }
  return days;
}

export function describeMealTime(meal: Pick<MealSessionLike, "startTime" | "endTime">): string {
  const start = meal.startTime?.trim();
  const end = meal.endTime?.trim();
  if (start && end) return `${start}-${end}`;
  if (start) return `${start} 起`;
  if (end) return `至 ${end}`;
  return "";
}
