import type { CSSProperties } from "react";
import { homeGridItemSchema } from "@/lib/validation";
import type { HomeGridItemInput, HomeGridColumns } from "@/lib/home-grid-config";

/**
 * 场景模板——纯数据与纯函数，不碰数据库，可完整单测。
 *
 * 模板只覆盖「宫格入口 + 页面外观」，刻意不含任何业务数据
 * （报名类型、日程、内容页文案），套用因此永远不会破坏已有业务记录。
 */

export type MeetingTemplateShape = {
  key: string;
  name: string;
  description: string;
  bgColor: string;
  bgImageUrl: string | null;
  bgOverlay: number;
  gridColumns: HomeGridColumns;
  gridRounded: boolean;
  items: HomeGridItemInput[];
};

const BG = "/imgs/anbg.png";

function item(
  title: string,
  href: string,
  icon: HomeGridItemInput["icon"],
  size: HomeGridItemInput["size"] = "SMALL",
): HomeGridItemInput {
  return { title, href, icon, size, backgroundImage: BG, isVisible: true };
}

export const BUILTIN_MEETING_TEMPLATES: MeetingTemplateShape[] = [
  {
    key: "academic",
    name: "学术年会",
    description: "日程、讲者、论文投稿、参会文件齐全，适合有征稿与分会场的学术会议。",
    bgColor: "#f1f5f9",
    bgImageUrl: null,
    bgOverlay: 0,
    gridColumns: 4,
    gridRounded: true,
    items: [
      item("注册报名", "/register-conf", "file"),
      item("会议日程", "/schedule", "calendar"),
      item("专家介绍", "/speakers", "users"),
      item("论文投稿", "/submissions", "book"),
      item("参会文件", "/materials", "folder"),
      item("会议通知", "/notices", "mail"),
      item("酒店预订", "/hotels", "hotel"),
      item("会场交通", "/venue", "car"),
      item("现场直播", "/live", "video"),
      item("现场照片", "/photos", "camera"),
      item("联系我们", "/contact", "phone"),
      item("个人中心", "/me", "home"),
    ],
  },
  {
    key: "teambuilding",
    name: "团建活动",
    description: "去掉投稿与日程，突出活动须知、照片与联系方式，适合公司团建、员工活动。",
    bgColor: "#ecfdf5",
    bgImageUrl: null,
    bgOverlay: 0,
    gridColumns: 3,
    gridRounded: true,
    items: [
      item("活动报名", "/register-conf", "file", "WIDE"),
      item("活动简介", "/intro", "info"),
      item("活动须知", "/notice", "alert"),
      item("集合交通", "/venue", "car"),
      item("现场照片", "/photos", "camera"),
      item("住宿安排", "/hotels", "hotel"),
      item("联系我们", "/contact", "phone"),
      item("意见反馈", "/feedback", "message"),
      item("个人中心", "/me", "home"),
    ],
  },
  {
    key: "investment",
    name: "招商会",
    description: "突出项目简介、参会须知与联系方式，报名入口做成大卡片，适合招商推介。",
    bgColor: "#fffbeb",
    bgImageUrl: null,
    bgOverlay: 0,
    gridColumns: 3,
    gridRounded: true,
    items: [
      item("立即报名", "/register-conf", "file", "LARGE"),
      item("项目简介", "/intro", "info"),
      item("参会须知", "/notice", "alert"),
      item("活动说明", "/guide", "book"),
      item("会场交通", "/venue", "car"),
      item("联系我们", "/contact", "phone"),
      item("意见反馈", "/feedback", "message"),
    ],
  },
  {
    key: "forum",
    name: "论坛",
    description: "以日程、嘉宾与直播为核心，适合单场或多场次的主题论坛。",
    bgColor: "#eff6ff",
    bgImageUrl: null,
    bgOverlay: 0,
    gridColumns: 3,
    gridRounded: true,
    items: [
      item("注册报名", "/register-conf", "file"),
      item("论坛日程", "/schedule", "calendar", "WIDE"),
      item("嘉宾介绍", "/speakers", "users"),
      item("现场直播", "/live", "video"),
      item("参会文件", "/materials", "folder"),
      item("会议通知", "/notices", "mail"),
      item("会场交通", "/venue", "car"),
      item("联系我们", "/contact", "phone"),
    ],
  },
  {
    key: "expo",
    name: "展会",
    description: "去掉投稿，强调交通指引、现场照片与联系方式，适合展览与展销活动。",
    bgColor: "#f5f3ff",
    bgImageUrl: null,
    bgOverlay: 0,
    gridColumns: 4,
    gridRounded: false,
    items: [
      item("参观登记", "/register-conf", "file"),
      item("展会简介", "/intro", "info"),
      item("参观须知", "/notice", "alert"),
      item("展馆交通", "/venue", "car", "WIDE"),
      item("现场照片", "/photos", "camera"),
      item("展会通知", "/notices", "mail"),
      item("酒店预订", "/hotels", "hotel"),
      item("联系我们", "/contact", "phone"),
      item("意见反馈", "/feedback", "message"),
    ],
  },
  {
    key: "summit",
    name: "行业峰会",
    description: "日程、讲者、直播、参会资料完整，适合规格较高的行业峰会。",
    bgColor: "#f8fafc",
    bgImageUrl: null,
    bgOverlay: 0,
    gridColumns: 4,
    gridRounded: true,
    items: [
      item("注册报名", "/register-conf", "file"),
      item("峰会日程", "/schedule", "calendar"),
      item("演讲嘉宾", "/speakers", "users"),
      item("参会文件", "/materials", "folder"),
      item("现场直播", "/live", "video", "WIDE"),
      item("峰会通知", "/notices", "mail"),
      item("酒店预订", "/hotels", "hotel"),
      item("会场交通", "/venue", "car"),
      item("现场照片", "/photos", "camera"),
      item("联系我们", "/contact", "phone"),
      item("意见反馈", "/feedback", "message"),
      item("个人中心", "/me", "home"),
    ],
  },
];

export function getBuiltinTemplate(key: string): MeetingTemplateShape | null {
  return BUILTIN_MEETING_TEMPLATES.find((t) => t.key === key) ?? null;
}

/**
 * 把任意来源的入口数组归一化成可安全写库的形状。
 * 逐条走 homeGridItemSchema——与手工编辑器完全相同的白名单，非法条目直接丢弃。
 */
export function normalizeTemplateItems(raw: unknown): HomeGridItemInput[] {
  if (!Array.isArray(raw)) return [];
  const result: HomeGridItemInput[] = [];
  for (const candidate of raw) {
    const parsed = homeGridItemSchema.safeParse(candidate);
    if (parsed.success) result.push(parsed.data);
  }
  return result;
}

/** 十六进制颜色白名单，避免把任意字符串塞进内联 style */
const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** 背景图地址同样只接受站内路径或 http(s)，与图片字段一致 */
function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  if (/^https?:\/\/[^\s]+$/i.test(url)) return url;
  return null;
}

export type MeetingAppearance = {
  bgColor: string;
  bgImageUrl: string | null;
  bgOverlay: number;
};

/**
 * 生成前台容器的内联背景样式。全部未配置时返回空对象，
 * 由 PublicLayout 的默认底色接管——不配置即与改造前表现一致。
 */
export function meetingBackgroundStyle(appearance: MeetingAppearance): CSSProperties {
  const style: CSSProperties = {};
  const color = HEX_COLOR.test(appearance.bgColor.trim()) ? appearance.bgColor.trim() : null;
  const image = safeUrl(appearance.bgImageUrl);

  if (color) style.backgroundColor = color;

  if (image) {
    const overlay = Math.min(80, Math.max(0, Math.round(appearance.bgOverlay))) / 100;
    const layers: string[] = [];
    if (overlay > 0) {
      const rgba = `rgba(255, 255, 255, ${overlay})`;
      layers.push(`linear-gradient(${rgba}, ${rgba})`);
    }
    layers.push(`url(${image})`);
    style.backgroundImage = layers.join(", ");
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
    style.backgroundAttachment = "fixed";
    style.backgroundRepeat = "no-repeat";
  }

  return style;
}
