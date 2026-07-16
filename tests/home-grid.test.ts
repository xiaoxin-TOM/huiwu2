import { describe, expect, test } from "vitest";
import {
  DEFAULT_HOME_GRID_ITEMS,
  HOME_GRID_COLUMNS_OPTIONS,
  autoFillHomeGridRows,
  homeGridArea,
  homeGridSizeClass,
  isExternalHomeGridHref,
} from "@/lib/home-grid-config";
import { homeGridSchema } from "@/lib/validation";

describe("首页入口宫格", () => {
  test("默认模板保留原有 12 个入口", () => {
    expect(DEFAULT_HOME_GRID_ITEMS).toHaveLength(12);
    expect(DEFAULT_HOME_GRID_ITEMS[0]).toMatchObject({
      title: "注册报名",
      href: "/register-conf",
    });
  });

  test("四种尺寸映射到正确面积和 Grid class", () => {
    expect(homeGridArea("SMALL")).toBe(1);
    expect(homeGridArea("WIDE")).toBe(2);
    expect(homeGridArea("TALL")).toBe(2);
    expect(homeGridArea("LARGE")).toBe(4);
    expect(homeGridSizeClass("LARGE")).toContain("col-span-2");
    expect(homeGridSizeClass("LARGE")).toContain("row-span-2");
  });

  test("六个标准入口可自动调整为完整两行", () => {
    const items = Array.from({ length: 6 }, () => ({ size: "SMALL" as const, isVisible: true }));
    const filled = autoFillHomeGridRows(items);
    expect(filled.reduce((sum, item) => sum + homeGridArea(item.size), 0)).toBe(8);
    expect(filled.filter((item) => item.size === "WIDE")).toHaveLength(2);
    expect(items.every((item) => item.size === "SMALL")).toBe(true);
  });

  test("允许站内路径和 http(s) 外链，拒绝脚本与协议相对地址", () => {
    const base = {
      title: "会议日程",
      icon: "calendar",
      size: "WIDE",
      backgroundImage: "",
      isVisible: true,
    } as const;
    expect(homeGridSchema.safeParse({ items: [{ ...base, href: "/schedule" }] }).success).toBe(true);
    expect(homeGridSchema.safeParse({ items: [{ ...base, href: "https://example.com/live" }] }).success).toBe(true);
    expect(homeGridSchema.safeParse({ items: [{ ...base, href: "javascript:alert(1)" }] }).success).toBe(false);
    expect(homeGridSchema.safeParse({ items: [{ ...base, href: "//example.com" }] }).success).toBe(false);
  });

  test("外链识别只接受 http(s)", () => {
    expect(isExternalHomeGridHref("https://example.com")).toBe(true);
    expect(isExternalHomeGridHref("http://example.com")).toBe(true);
    expect(isExternalHomeGridHref("/schedule")).toBe(false);
  });

  test("入口数量限制为 1 到 24 个", () => {
    expect(homeGridSchema.safeParse({ items: [] }).success).toBe(false);
    const item = {
      title: "入口",
      href: "/",
      icon: "link",
      size: "SMALL",
      backgroundImage: "",
      isVisible: true,
    } as const;
    expect(homeGridSchema.safeParse({ items: Array.from({ length: 24 }, () => item) }).success).toBe(true);
    expect(homeGridSchema.safeParse({ items: Array.from({ length: 25 }, () => item) }).success).toBe(false);
  });

  test("每行数量支持 2/3/4 且默认 4", () => {
    expect(HOME_GRID_COLUMNS_OPTIONS.map((o) => o.value)).toEqual([2, 3, 4]);
    const item = {
      title: "入口",
      href: "/",
      icon: "link",
      size: "SMALL",
      backgroundImage: "",
      isVisible: true,
    } as const;
    expect(homeGridSchema.safeParse({ items: [item] }).data?.columns).toBe(4);
    expect(homeGridSchema.safeParse({ columns: 3, items: [item] }).data?.columns).toBe(3);
    expect(homeGridSchema.safeParse({ columns: 1, items: [item] }).success).toBe(false);
    expect(homeGridSchema.safeParse({ columns: 5, items: [item] }).success).toBe(false);
  });

  test("自动铺满按每行数量补全", () => {
    const items = Array.from({ length: 5 }, () => ({ size: "SMALL" as const, isVisible: true }));
    const filled4 = autoFillHomeGridRows(items, 4);
    expect(filled4.reduce((sum, item) => sum + homeGridArea(item.size), 0)).toBe(8);
    const filled3 = autoFillHomeGridRows(items, 3);
    expect(filled3.reduce((sum, item) => sum + homeGridArea(item.size), 0)).toBe(6);
  });
});
