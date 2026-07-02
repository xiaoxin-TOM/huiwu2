"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * 后台外壳:桌面(md+)保持宋设计的固定侧栏;手机(<md)侧栏收起为抽屉,
 * 顶部条提供汉堡按钮,点遮罩或切换路由后自动关闭。
 * sidebar 为服务端渲染好的侧栏内容(含图标),作为 slot 传入。
 */
export default function AdminShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 切换后台页面后自动收起抽屉
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-admin-bg">
      {/* 移动端顶部条 */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-12 items-center gap-2 bg-admin-sidebar px-3 text-white shadow md:hidden">
        <button
          type="button"
          aria-label="打开菜单"
          onClick={() => setOpen(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded hover:bg-white/10"
        >
          <span className="text-2xl leading-none">☰</span>
        </button>
        <span className="font-semibold tracking-wide">会务管理系统</span>
      </div>

      {/* 遮罩(仅移动端抽屉打开时) */}
      {open && (
        <div
          data-testid="admin-drawer-overlay"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      {/* 侧栏:桌面 sticky 常驻;移动端为抽屉 */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-56 shrink-0 transform flex-col bg-gradient-to-b from-admin-sidebar to-admin-sidebar-dark text-white shadow-xl transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </aside>

      {/* 内容区:移动端顶部留出顶部条高度 */}
      <main className="flex-1 overflow-x-hidden p-6 pt-16 md:pt-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
