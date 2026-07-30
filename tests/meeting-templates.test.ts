import { expect, test } from "vitest";
import {
  BUILTIN_MEETING_TEMPLATES,
  getBuiltinTemplate,
  normalizeTemplateItems,
  meetingBackgroundStyle,
  type MeetingTemplateShape,
} from "@/lib/meeting-templates";
import { HOME_GRID_ICON_KEYS, HOME_GRID_SIZE_KEYS, HOME_GRID_ROUTE_OPTIONS } from "@/lib/home-grid-config";

test("内置模板覆盖六个场景且 key 唯一", () => {
  expect(BUILTIN_MEETING_TEMPLATES.length).toBeGreaterThanOrEqual(6);
  const keys = BUILTIN_MEETING_TEMPLATES.map((t) => t.key);
  expect(new Set(keys).size).toBe(keys.length);
});

test("每套内置模板都有名称、说明和至少 4 个入口", () => {
  for (const t of BUILTIN_MEETING_TEMPLATES) {
    expect(t.name.trim().length).toBeGreaterThan(0);
    expect(t.description.trim().length).toBeGreaterThan(0);
    expect(t.items.length).toBeGreaterThanOrEqual(4);
  }
});

test("内置模板的图标、尺寸、跳转地址都在白名单内", () => {
  const routes = new Set(HOME_GRID_ROUTE_OPTIONS.map((r) => r.value as string));
  for (const t of BUILTIN_MEETING_TEMPLATES) {
    for (const item of t.items) {
      expect(HOME_GRID_ICON_KEYS).toContain(item.icon);
      expect(HOME_GRID_SIZE_KEYS).toContain(item.size);
      expect(routes.has(item.href)).toBe(true);
    }
  }
});

test("内置模板的列数只能是 2/3/4", () => {
  for (const t of BUILTIN_MEETING_TEMPLATES) {
    expect([2, 3, 4]).toContain(t.gridColumns);
  }
});

test("getBuiltinTemplate 命中已知 key，未知 key 返回 null", () => {
  const first = BUILTIN_MEETING_TEMPLATES[0];
  expect(getBuiltinTemplate(first.key)?.name).toBe(first.name);
  expect(getBuiltinTemplate("no-such-scene")).toBeNull();
});

test("normalizeTemplateItems 丢弃非法条目，保留合法条目", () => {
  const items = normalizeTemplateItems([
    { title: "注册报名", href: "/register-conf", icon: "file", size: "SMALL", backgroundImage: "", isVisible: true },
    { title: "坏图标", href: "/intro", icon: "not-an-icon", size: "SMALL", backgroundImage: "", isVisible: true },
    { title: "坏尺寸", href: "/intro", icon: "info", size: "HUGE", backgroundImage: "", isVisible: true },
    { title: "", href: "/intro", icon: "info", size: "SMALL", backgroundImage: "", isVisible: true },
  ]);
  expect(items).toHaveLength(1);
  expect(items[0].title).toBe("注册报名");
});

test("normalizeTemplateItems 挡掉危险跳转地址", () => {
  const items = normalizeTemplateItems([
    { title: "恶意", href: "javascript:alert(1)", icon: "link", size: "SMALL", backgroundImage: "", isVisible: true },
    { title: "协议相对", href: "//evil.com", icon: "link", size: "SMALL", backgroundImage: "", isVisible: true },
    { title: "外链", href: "https://example.com/ok", icon: "link", size: "SMALL", backgroundImage: "", isVisible: true },
  ]);
  expect(items.map((i) => i.title)).toEqual(["外链"]);
});

test("normalizeTemplateItems 面对非数组或垃圾输入返回空数组，不抛异常", () => {
  for (const bad of [null, undefined, "字符串", 42, {}, [1, 2, 3], [null]]) {
    expect(normalizeTemplateItems(bad)).toEqual([]);
  }
});

test("背景样式：未配置时返回空对象，走前台默认底色", () => {
  expect(meetingBackgroundStyle({ bgColor: "", bgImageUrl: null, bgOverlay: 0 })).toEqual({});
});

test("背景样式：只有底色时输出 backgroundColor", () => {
  const style = meetingBackgroundStyle({ bgColor: "#eef2ff", bgImageUrl: null, bgOverlay: 0 });
  expect(style.backgroundColor).toBe("#eef2ff");
  expect(style.backgroundImage).toBeUndefined();
});

test("背景样式：有背景图时固定铺满，蒙版按透明度叠加", () => {
  const style = meetingBackgroundStyle({ bgColor: "#ffffff", bgImageUrl: "/bg.jpg", bgOverlay: 40 });
  expect(style.backgroundImage).toContain("/bg.jpg");
  expect(style.backgroundImage).toContain("rgba(255, 255, 255, 0.4)");
  expect(style.backgroundSize).toBe("cover");
});

test("背景样式：非法底色被忽略，避免注入到 style 里", () => {
  const style = meetingBackgroundStyle({ bgColor: "red; background: url(evil)", bgImageUrl: null, bgOverlay: 0 });
  expect(style.backgroundColor).toBeUndefined();
});

test("背景样式：蒙版透明度超范围被夹到 0-80", () => {
  const high = meetingBackgroundStyle({ bgColor: "", bgImageUrl: "/bg.jpg", bgOverlay: 999 });
  expect(high.backgroundImage).toContain("0.8");
  const low = meetingBackgroundStyle({ bgColor: "", bgImageUrl: "/bg.jpg", bgOverlay: -5 });
  expect(low.backgroundImage).not.toContain("rgba");
});

test("模板形状可直接用于套用，字段齐全", () => {
  const t: MeetingTemplateShape = BUILTIN_MEETING_TEMPLATES[0];
  expect(typeof t.gridRounded).toBe("boolean");
  expect(typeof t.bgColor).toBe("string");
  expect(t.bgOverlay).toBeGreaterThanOrEqual(0);
});
