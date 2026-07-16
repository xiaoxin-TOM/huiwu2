export const HOME_GRID_ICON_KEYS = [
  "file", "info", "book", "alert", "mail", "calendar", "users", "camera",
  "car", "video", "hotel", "phone", "home", "star", "link",
] as const;

export const HOME_GRID_ICON_OPTIONS = [
  { value: "file", label: "报名 / 文件" },
  { value: "info", label: "活动简介" },
  { value: "book", label: "活动说明" },
  { value: "alert", label: "活动须知" },
  { value: "mail", label: "会议通知" },
  { value: "calendar", label: "会议日程" },
  { value: "users", label: "专家 / 嘉宾" },
  { value: "camera", label: "照片" },
  { value: "car", label: "交通" },
  { value: "video", label: "直播" },
  { value: "hotel", label: "酒店" },
  { value: "phone", label: "联系" },
  { value: "home", label: "首页" },
  { value: "star", label: "推荐" },
  { value: "link", label: "链接" },
] as const;

export const HOME_GRID_SIZE_KEYS = ["SMALL", "WIDE", "TALL", "LARGE"] as const;

export const HOME_GRID_SIZE_OPTIONS = [
  { value: "SMALL", label: "标准 1×1" },
  { value: "WIDE", label: "横向 2×1" },
  { value: "TALL", label: "纵向 1×2" },
  { value: "LARGE", label: "大卡片 2×2" },
] as const;

export const HOME_GRID_COLUMNS_OPTIONS = [
  { value: 2, label: "每行 2 个" },
  { value: 3, label: "每行 3 个" },
  { value: 4, label: "每行 4 个" },
] as const;

export type HomeGridColumns = (typeof HOME_GRID_COLUMNS_OPTIONS)[number]["value"];
export const DEFAULT_HOME_GRID_COLUMNS: HomeGridColumns = 4;

export const HOME_GRID_ROUTE_OPTIONS = [
  { value: "/register-conf", label: "注册报名" },
  { value: "/intro", label: "活动简介" },
  { value: "/guide", label: "活动说明" },
  { value: "/notice", label: "活动须知" },
  { value: "/notices", label: "会议通知" },
  { value: "/schedule", label: "会议日程" },
  { value: "/speakers", label: "专家介绍" },
  { value: "/photos", label: "现场照片" },
  { value: "/venue", label: "会场交通" },
  { value: "/live", label: "现场直播" },
  { value: "/hotels", label: "酒店预订" },
  { value: "/contact", label: "联系我们" },
  { value: "/submissions", label: "论文投稿" },
  { value: "/me", label: "个人中心" },
] as const;

export type HomeGridIconKey = (typeof HOME_GRID_ICON_KEYS)[number];
export type HomeGridSize = (typeof HOME_GRID_SIZE_KEYS)[number];

export interface HomeGridItemInput {
  title: string;
  href: string;
  icon: HomeGridIconKey;
  size: HomeGridSize;
  backgroundImage: string;
  isVisible: boolean;
}

export const DEFAULT_HOME_GRID_ITEMS: HomeGridItemInput[] = [
  { title: "注册报名", href: "/register-conf", icon: "file", size: "SMALL", backgroundImage: "/imgs/anbg.png", isVisible: true },
  { title: "活动简介", href: "/intro", icon: "info", size: "SMALL", backgroundImage: "/imgs/anbg.png", isVisible: true },
  { title: "活动说明", href: "/guide", icon: "book", size: "SMALL", backgroundImage: "/imgs/anbg.png", isVisible: true },
  { title: "活动须知", href: "/notice", icon: "alert", size: "SMALL", backgroundImage: "/imgs/anbg.png", isVisible: true },
  { title: "会议通知", href: "/notices", icon: "mail", size: "SMALL", backgroundImage: "/imgs/anbg.png", isVisible: true },
  { title: "会议日程", href: "/schedule", icon: "calendar", size: "SMALL", backgroundImage: "/imgs/anbg.png", isVisible: true },
  { title: "专家介绍", href: "/speakers", icon: "users", size: "SMALL", backgroundImage: "/imgs/anbg.png", isVisible: true },
  { title: "现场照片", href: "/photos", icon: "camera", size: "SMALL", backgroundImage: "/imgs/anbg.png", isVisible: true },
  { title: "会场交通", href: "/venue", icon: "car", size: "SMALL", backgroundImage: "/imgs/anbg.png", isVisible: true },
  { title: "现场直播", href: "/live", icon: "video", size: "SMALL", backgroundImage: "/imgs/anbg.png", isVisible: true },
  { title: "酒店预订", href: "/hotels", icon: "hotel", size: "SMALL", backgroundImage: "/imgs/anbg.png", isVisible: true },
  { title: "联系我们", href: "/contact", icon: "phone", size: "SMALL", backgroundImage: "/imgs/anbg.png", isVisible: true },
];

export function homeGridSizeClass(size: HomeGridSize): string {
  switch (size) {
    case "WIDE":
      return "col-span-2 row-span-1";
    case "TALL":
      return "col-span-1 row-span-2";
    case "LARGE":
      return "col-span-2 row-span-2";
    default:
      return "col-span-1 row-span-1";
  }
}

export function homeGridArea(size: HomeGridSize): number {
  if (size === "LARGE") return 4;
  if (size === "WIDE" || size === "TALL") return 2;
  return 1;
}

export function autoFillHomeGridRows<T extends { size: HomeGridSize; isVisible: boolean }>(
  items: T[],
  columns: HomeGridColumns = DEFAULT_HOME_GRID_COLUMNS,
): Array<Omit<T, "size"> & { size: HomeGridSize }> {
  const next: Array<Omit<T, "size"> & { size: HomeGridSize }> = items.map((item) => ({
    ...item,
    size: item.size,
  }));
  const area = next.filter((item) => item.isVisible).reduce((sum, item) => sum + homeGridArea(item.size), 0);
  let missing = (columns - (area % columns)) % columns;
  if (missing === 0) return next;

  if (missing === 3) {
    const small = next.find((item) => item.isVisible && item.size === "SMALL");
    if (small) {
      small.size = "LARGE";
      return next;
    }
  }

  while (missing >= 2) {
    const medium = next.find((item) => item.isVisible && (item.size === "WIDE" || item.size === "TALL"));
    if (!medium) break;
    medium.size = "LARGE";
    missing -= 2;
  }

  while (missing > 0) {
    const small = next.find((item) => item.isVisible && item.size === "SMALL");
    if (!small) break;
    small.size = "WIDE";
    missing -= 1;
  }

  return next;
}

export function isExternalHomeGridHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
