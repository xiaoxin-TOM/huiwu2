import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getUserRegistration } from "@/lib/registrations";
import { listUserSubmissions } from "@/lib/submissions";
import { listUserBookings } from "@/lib/bookings";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "未通过",
};

export default async function MePage() {
  const user = await requireUser();
  const [registration, submissions, bookings] = await Promise.all([
    getUserRegistration(user.id),
    listUserSubmissions(user.id),
    listUserBookings(user.id),
  ]);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">个人中心</h1>
      <p className="text-gray-600">{user.name}（{user.email}）</p>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">我的报名</h2>
        {registration ? (
          <p className="text-sm">
            {registration.type.name} ·
            <span className="ml-1 text-sky-700">{STATUS_LABEL[registration.status] ?? registration.status}</span>
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            尚未报名。<Link href="/register-conf" className="text-sky-700 hover:underline">去报名</Link>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">我的投稿</h2>
        {submissions.length === 0 ? (
          <p className="text-sm text-gray-500">
            尚无投稿。<Link href="/submissions" className="text-sky-700 hover:underline">去投稿</Link>
          </p>
        ) : (
          <ul className="divide-y rounded border">
            {submissions.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="font-medium">{s.title}</span>
                <span className="ml-auto text-sky-700">{STATUS_LABEL[s.status] ?? s.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">我的酒店预订</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-gray-500">
            尚无预订。<a href="/hotels" className="text-sky-700 hover:underline">去预订</a>
          </p>
        ) : (
          <ul className="divide-y rounded border">
            {bookings.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="font-medium">{b.hotel.name}</span>
                <span className="text-gray-400">{b.checkIn} → {b.checkOut} · {b.rooms} 间</span>
                <span className="ml-auto text-sky-700">{STATUS_LABEL[b.status] ?? b.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
