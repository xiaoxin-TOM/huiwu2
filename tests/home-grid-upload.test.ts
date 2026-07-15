import { beforeEach, expect, test, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/meetings", () => ({ requireCurrentMeetingForRequest: vi.fn() }));
vi.mock("@/lib/oss", () => ({
  uploadHomeGridImageToOSS: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { uploadHomeGridImageToOSS } from "@/lib/oss";
import { POST } from "@/app/api/admin/home-grid/upload/route";

const mockedAuth = vi.mocked(auth);
const mockedMeeting = vi.mocked(requireCurrentMeetingForRequest);
const mockedUpload = vi.mocked(uploadHomeGridImageToOSS);

beforeEach(() => {
  vi.clearAllMocks();
});

test("首页图片上传接口拒绝普通用户", async () => {
  mockedAuth.mockResolvedValue({ user: { id: "u1", role: "USER" } } as never);
  const response = await POST(new Request("http://localhost/api/admin/home-grid/upload", { method: "POST" }));
  expect(response.status).toBe(403);
  expect(mockedUpload).not.toHaveBeenCalled();
});

test("管理员上传图片后返回 OSS 地址", async () => {
  mockedAuth.mockResolvedValue({ user: { id: "admin", role: "ADMIN" } } as never);
  mockedMeeting.mockResolvedValue({ id: "meeting-1" } as never);
  mockedUpload.mockResolvedValue("https://cdn.example.com/uploads/meetings/meeting-1/home-grid/card.png");

  const form = new FormData();
  form.set("file", new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "card.png", { type: "image/png" }));
  const response = await POST(new Request("http://localhost/api/admin/home-grid/upload", {
    method: "POST",
    body: form,
  }));
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.url).toContain("meeting-1/home-grid/card.png");
  expect(mockedUpload).toHaveBeenCalledWith(expect.objectContaining({ meetingId: "meeting-1", mime: "image/png" }));
});
