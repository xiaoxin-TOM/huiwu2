import { listBookings } from "@/lib/bookings";
import { STATUS_LABEL } from "@/lib/labels";
import AdminForm from "@/components/AdminForm";

function ReviewButtons({ id }: { id: string }) {
  return (
    <div className="flex gap-2">
      <AdminForm action={`/api/admin/bookings/${id}`} redirectTo="/admin/bookings">
        <input type="hidden" name="decision" value="APPROVED" />
        <button type="submit" className="rounded bg-green-600 px-2 py-1 text-xs text-white">通过</button>
      </AdminForm>
      <AdminForm action={`/api/admin/bookings/${id}`} redirectTo="/admin/bookings">
        <input type="hidden" name="decision" value="REJECTED" />
        <button type="submit" className="rounded bg-red-600 px-2 py-1 text-xs text-white">拒绝</button>
      </AdminForm>
    </div>
  );
}

export default async function AdminBookingsPage() {
  const bookings = await listBookings();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">预订管理</h1>
      {bookings.length === 0 ? (
        <p className="text-gray-500">暂无预订。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">预订人</th><th>酒店</th><th>入住</th><th>离店</th><th>房间</th><th>状态</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b">
                  <td className="py-2">{b.user.email}</td>
                  <td>{b.hotel.name}</td>
                  <td>{b.checkIn}</td>
                  <td>{b.checkOut}</td>
                  <td>{b.rooms}</td>
                  <td className="text-sky-700">{STATUS_LABEL[b.status] ?? b.status}</td>
                  <td><ReviewButtons id={b.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
