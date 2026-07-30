import { beforeEach, expect, test, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/home-grid", () => ({ replaceHomeGridItems: vi.fn(), setHomeGridLayoutAndAppearance: vi.fn() }));
vi.mock("@/lib/meetings", () => ({ requireCurrentMeetingForRequest: vi.fn() }));

import { auth } from "@/lib/auth";
import { replaceHomeGridItems, setHomeGridLayoutAndAppearance } from "@/lib/home-grid";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { POST } from "@/app/api/admin/home-grid/route";

const mockedAuth = vi.mocked(auth);
const mockedReplace = vi.mocked(replaceHomeGridItems);
const mockedSetLayout = vi.mocked(setHomeGridLayoutAndAppearance);
const mockedMeeting = vi.mocked(requireCurrentMeetingForRequest);

beforeEach(() => {
  vi.clearAllMocks();
});

test("首页宫格保存接口拒绝普通用户", async () => {
  mockedAuth.mockResolvedValue({ user: { id: "u1", role: "USER" } } as never);
  const response = await POST(new Request("http://localhost/api/admin/home-grid", { method: "POST" }));
  expect(response.status).toBe(403);
  expect(mockedReplace).not.toHaveBeenCalled();
  expect(mockedSetLayout).not.toHaveBeenCalled();
});

test("管理员可保存当前会议的宫格配置", async () => {
  mockedAuth.mockResolvedValue({ user: { id: "admin", role: "ADMIN" } } as never);
  mockedMeeting.mockResolvedValue({ id: "meeting-1" } as never);
  const items = [{
    title: "会议日程",
    href: "/schedule",
    icon: "calendar",
    size: "WIDE",
    backgroundImage: "",
    isVisible: true,
  }];
  const response = await POST(new Request("http://localhost/api/admin/home-grid", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ columns: 3, items }),
  }));

  expect(response.status).toBe(200);
  // 布局与外观合并为一次写入；未传的外观字段落到默认值，前台仍走默认底色
  expect(mockedSetLayout).toHaveBeenCalledWith("meeting-1", {
    columns: 3,
    rounded: true,
    bgColor: "",
    bgImageUrl: "",
    bgOverlay: 0,
  });
  expect(mockedReplace).toHaveBeenCalledWith("meeting-1", items);
});
