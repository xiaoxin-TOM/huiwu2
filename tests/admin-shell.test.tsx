// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

import AdminShell from "@/components/AdminShell";

afterEach(cleanup);

const menu = [
  { href: "/admin", label: "仪表盘" },
  { href: "/admin/site", label: "站点设置" },
];

test("点击汉堡打开抽屉,点遮罩关闭", () => {
  render(
    <AdminShell menu={menu}>
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
