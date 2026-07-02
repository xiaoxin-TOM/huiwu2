import { expect, test } from "vitest";
import { siteConfigSchema } from "@/lib/validation";

test("站点设置:必填会议名,选填默认空串", () => {
  expect(siteConfigSchema.safeParse({ confName: "" }).success).toBe(false);
  const r = siteConfigSchema.safeParse({
    confName: "示例年会", confDate: "2026-09", confLocation: "北京",
  });
  expect(r.success).toBe(true);
  if (r.success) expect(r.data.liveUrl).toBe("");
});

test("站点设置:会场坐标选填,非法值拒绝", () => {
  const base = { confName: "示例年会" };
  // 全部留空:通过,默认空串
  const empty = siteConfigSchema.safeParse(base);
  expect(empty.success).toBe(true);
  if (empty.success) {
    expect(empty.data.venueLng).toBe("");
    expect(empty.data.venueName).toBe("");
  }
  // 合法坐标:通过
  expect(
    siteConfigSchema.safeParse({
      ...base, venueLng: "116.397", venueLat: "39.909",
      venueName: "北京国际会议中心", venueAddress: "北辰东路8号",
    }).success
  ).toBe(true);
  // 非数字 / 越界:拒绝
  expect(siteConfigSchema.safeParse({ ...base, venueLng: "abc" }).success).toBe(false);
  expect(siteConfigSchema.safeParse({ ...base, venueLng: "181" }).success).toBe(false);
  expect(siteConfigSchema.safeParse({ ...base, venueLat: "-91" }).success).toBe(false);
});
