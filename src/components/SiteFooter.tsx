export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-slate-500 space-y-1">
        <p>© {new Date().getFullYear()} 会务管理系统 · All rights reserved.</p>
        <p>中国医院协会 版权所有</p>
        <p>技术支持由位值科技有限公司提供</p>
      </div>
    </footer>
  );
}
