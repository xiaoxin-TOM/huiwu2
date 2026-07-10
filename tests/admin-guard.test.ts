import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/lib/auth";
import { GET as exportRegistrations } from "@/app/api/admin/registrations/export/route";

const mockedAuth = vi.mocked(auth);

beforeEach(() => mockedAuth.mockReset());
afterEach(() => vi.restoreAllMocks());

test("未登录导出报名返回 403", async () => {
  mockedAuth.mockResolvedValue(null as never);
  const res = await exportRegistrations(new Request("http://localhost/api/admin/registrations/export"));
  expect(res.status).toBe(403);
});

test("普通用户导出报名返回 403", async () => {
  mockedAuth.mockResolvedValue({ user: { id: "u1", role: "USER" } } as never);
  const res = await exportRegistrations(new Request("http://localhost/api/admin/registrations/export"));
  expect(res.status).toBe(403);
});
