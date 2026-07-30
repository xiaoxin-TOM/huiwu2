import { expect, test } from "vitest";
import {
  MEAL_SLOTS,
  MEAL_SLOT_LABEL,
  normalizeTypeIds,
  isEligibleForMeal,
  groupMealsByDay,
  describeMealTime,
  type MealSessionLike,
} from "@/lib/meals";

function meal(over: Partial<MealSessionLike> = {}): MealSessionLike {
  return {
    id: "m1",
    day: "2026-08-12",
    slot: "LUNCH",
    name: "自助午餐",
    venue: "三楼宴会厅",
    startTime: "12:00",
    endTime: "13:30",
    typeIds: [],
    ...over,
  };
}

test("三个餐次都有中文标签", () => {
  for (const s of MEAL_SLOTS) {
    expect(MEAL_SLOT_LABEL[s]?.length).toBeGreaterThan(0);
  }
});

test("typeIds 为空数组时所有参会类型都可用", () => {
  expect(isEligibleForMeal(meal({ typeIds: [] }), "any-type")).toBe(true);
  expect(isEligibleForMeal(meal({ typeIds: [] }), null)).toBe(true);
});

test("typeIds 非空时只有命中的类型可用", () => {
  const m = meal({ typeIds: ["t-vip", "t-speaker"] });
  expect(isEligibleForMeal(m, "t-vip")).toBe(true);
  expect(isEligibleForMeal(m, "t-normal")).toBe(false);
  // 限定了类型但用户没有类型，一律不可用
  expect(isEligibleForMeal(m, null)).toBe(false);
});

test("normalizeTypeIds 只保留非空字符串并去重", () => {
  expect(normalizeTypeIds(["a", "a", " b ", "", null, 42, undefined])).toEqual(["a", "b"]);
});

test("normalizeTypeIds 面对非数组返回空数组，不抛异常", () => {
  for (const bad of [null, undefined, "abc", 1, {}]) {
    expect(normalizeTypeIds(bad)).toEqual([]);
  }
});

test("按日期分组并按餐次先后排序", () => {
  const days = groupMealsByDay([
    meal({ id: "d2-dinner", day: "2026-08-13", slot: "DINNER" }),
    meal({ id: "d1-dinner", day: "2026-08-12", slot: "DINNER" }),
    meal({ id: "d1-breakfast", day: "2026-08-12", slot: "BREAKFAST" }),
    meal({ id: "d1-lunch", day: "2026-08-12", slot: "LUNCH" }),
  ]);

  expect(days.map((d) => d.day)).toEqual(["2026-08-12", "2026-08-13"]);
  expect(days[0].meals.map((m) => m.id)).toEqual(["d1-breakfast", "d1-lunch", "d1-dinner"]);
});

test("分组对空输入返回空数组", () => {
  expect(groupMealsByDay([])).toEqual([]);
});

test("时间描述：两端都有显示区间，缺一端只显示已有的", () => {
  expect(describeMealTime(meal({ startTime: "12:00", endTime: "13:30" }))).toBe("12:00-13:30");
  expect(describeMealTime(meal({ startTime: "12:00", endTime: "" }))).toBe("12:00 起");
  expect(describeMealTime(meal({ startTime: "", endTime: "13:30" }))).toBe("至 13:30");
  expect(describeMealTime(meal({ startTime: "", endTime: "" }))).toBe("");
});

test("餐次名称留空时用餐次标签兜底，不出现空标题", () => {
  const m = meal({ name: "", slot: "BREAKFAST" });
  expect(m.name || MEAL_SLOT_LABEL[m.slot]).toBe("早餐");
});
