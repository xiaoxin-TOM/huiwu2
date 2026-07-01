"use client";
import Link from "next/link";
import { useState } from "react";

type MenuItem = { href: string; label: string };

export default function AdminShell({
  menu,
  children,
}: {
  menu: MenuItem[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="flex min-h-screen">
      {/* 移动端顶部条 */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-12 items-center gap-2 border-b bg-gray-900 px-3 text-gray-100 md:hidden">
        <button
          type="button"
          aria-label="打开菜单"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded hover:bg-gray-800"
        >
          <span className="text-2xl leading-none">☰</span>
        </button>
        <span className="font-bold">管理后台</span>
      </div>

      {/* 遮罩(仅移动端打开时) */}
      {open && (
        <div
          data-testid="admin-drawer-overlay"
          onClick={close}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      {/* 侧栏:md+ 常驻;移动端为抽屉 */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-52 shrink-0 transform border-r bg-gray-900 text-gray-100 transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 font-bold">管理后台</div>
        <nav className="flex flex-col">
          {menu.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              onClick={close}
              className="px-4 py-2 text-sm hover:bg-gray-800"
            >
              {m.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* 内容区:移动端留出顶部条高度 */}
      <main className="flex-1 bg-gray-50 p-6 pt-16 md:pt-6">{children}</main>
    </div>
  );
}
