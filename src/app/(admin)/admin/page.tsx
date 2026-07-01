import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [users, regs, subs, bookings, albums] = await Promise.all([
    prisma.user.count(),
    prisma.registration.count(),
    prisma.submission.count(),
    prisma.hotelBooking.count(),
    prisma.album.count(),
  ]);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">仪表盘</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          ["用户", users],
          ["报名", regs],
          ["投稿", subs],
          ["预订", bookings],
          ["相册", albums],
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
