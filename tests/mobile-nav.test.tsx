// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

// 隔离 next/link 的路由依赖:测试里渲染成普通 <a>
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

import MobileNav from "@/components/MobileNav";

afterEach(cleanup);

const items = [
  { href: "/", label: "首页" },
  { href: "/notices", label: "会议通知" },
];

test("初始收起时不渲染菜单项", () => {
  render(<MobileNav items={items} accountHref="/login" accountLabel="登录 / 注册" />);
  expect(screen.queryByText("会议通知")).toBeNull();
});

test("点击汉堡按钮展开,再点收起", () => {
  render(<MobileNav items={items} accountHref="/login" accountLabel="登录 / 注册" />);
  const btn = screen.getByRole("button", { name: "菜单" });
  fireEvent.click(btn);
  expect(screen.getByText("会议通知")).toBeTruthy();
  expect(screen.getByText("登录 / 注册")).toBeTruthy();
  fireEvent.click(btn);
  expect(screen.queryByText("会议通知")).toBeNull();
});
