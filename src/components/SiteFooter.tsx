export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} 会务管理系统 ·  All rights reserved.
      </div>
    </footer>
  );
}
