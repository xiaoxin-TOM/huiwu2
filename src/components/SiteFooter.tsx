export default function SiteFooter() {
  return (
    <footer className="mt-12 border-t bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-500">
        © {new Date().getFullYear()} 会务管理系统
      </div>
    </footer>
  );
}
