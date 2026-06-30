import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [users, regs, subs] = await Promise.all([
    prisma.user.count(),
    prisma.registration.count(),
    prisma.submission.count(),
  ]);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">仪表盘</h1>
      <div className="grid grid-cols-3 gap-4">
        {[
          ["用户", users],
          ["报名", regs],
          ["投稿", subs],
        ].map(([label, n]) => (
          <div key={label as string} className="rounded border bg-white p-4">
            <div className="text-sm text-gray-500">{label}</div>
            <div className="text-2xl font-bold">{n as number}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
