// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin" }));

import AdminShell from "@/components/AdminShell";

afterEach(cleanup);

test("点击汉堡打开抽屉,点遮罩关闭", () => {
  render(
    <AdminShell sidebar={<div>侧栏</div>}>
      <div>内容区</div>
    </AdminShell>,
  );
  // 初始:遮罩不存在
  expect(screen.queryByTestId("admin-drawer-overlay")).toBeNull();
  // 打开
  fireEvent.click(screen.getByRole("button", { name: "打开菜单" }));
  expect(screen.getByTestId("admin-drawer-overlay")).toBeTruthy();
  // 点遮罩关闭
  fireEvent.click(screen.getByTestId("admin-drawer-overlay"));
  expect(screen.queryByTestId("admin-drawer-overlay")).toBeNull();
});
