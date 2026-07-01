export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg">
        <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-6 text-center">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-sky-100">{subtitle}</p>}
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
