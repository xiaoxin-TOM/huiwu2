import { beforeEach, expect, test, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/live", () => ({ replaceLiveStreams: vi.fn() }));
vi.mock("@/lib/meetings", () => ({ requireCurrentMeetingForRequest: vi.fn() }));

import { auth } from "@/lib/auth";
import { replaceLiveStreams } from "@/lib/live";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { POST } from "@/app/api/admin/live/route";

const mockedAuth = vi.mocked(auth);
const mockedReplace = vi.mocked(replaceLiveStreams);
const mockedMeeting = vi.mocked(requireCurrentMeetingForRequest);

beforeEach(() => {
  vi.clearAllMocks();
});

test("直播保存接口拒绝普通用户", async () => {
  mockedAuth.mockResolvedValue({ user: { id: "u1", role: "USER" } } as never);
  const response = await POST(new Request("http://localhost/api/admin/live", { method: "POST" }));
  expect(response.status).toBe(403);
  expect(mockedReplace).not.toHaveBeenCalled();
});

test("管理员可保存当前会议的直播会场", async () => {
  mockedAuth.mockResolvedValue({ user: { id: "admin", role: "ADMIN" } } as never);
  mockedMeeting.mockResolvedValue({ id: "meeting-1" } as never);
  const items = [
    { name: "主会场", url: "https://live.example.com/main", coverImage: "", introImage: "", description: "开幕式", time: "2026-09-18 09:00-12:00", isVisible: true },
    { name: "分会场 A", url: "https://live.example.com/a", coverImage: "", introImage: "", description: "", time: "", isVisible: false },
  ];
  const response = await POST(new Request("http://localhost/api/admin/live", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  }));

  expect(response.status).toBe(200);
  expect(mockedReplace).toHaveBeenCalledWith("meeting-1", items, false);
});

test("直播地址必须是非空的 http(s) 链接", async () => {
  mockedAuth.mockResolvedValue({ user: { id: "admin", role: "ADMIN" } } as never);
  mockedMeeting.mockResolvedValue({ id: "meeting-1" } as never);
  const response = await POST(new Request("http://localhost/api/admin/live", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [{ name: "主会场", url: "/live", coverImage: "", introImage: "", description: "", time: "", isVisible: true }] }),
  }));
  expect(response.status).toBe(400);
  expect(mockedReplace).not.toHaveBeenCalled();
});

test("直播介绍图片只允许空或有效图片地址", async () => {
  mockedAuth.mockResolvedValue({ user: { id: "admin", role: "ADMIN" } } as never);
  mockedMeeting.mockResolvedValue({ id: "meeting-1" } as never);
  const response = await POST(new Request("http://localhost/api/admin/live", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [{ name: "主会场", url: "https://live.example.com", coverImage: "", introImage: "//invalid", description: "", time: "", isVisible: true }] }),
  }));
  expect(response.status).toBe(400);
  expect(mockedReplace).not.toHaveBeenCalled();
});
