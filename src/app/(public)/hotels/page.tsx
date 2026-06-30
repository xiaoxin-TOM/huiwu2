import { listHotels } from "@/lib/hotels";
import RichText from "@/components/RichText";
import BookingForm from "@/components/BookingForm";

export default async function HotelsPage() {
  const hotels = await listHotels();
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">酒店预订</h1>

      {hotels.length === 0 ? (
        <p className="text-gray-500">暂无酒店信息。</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {hotels.map((h) => (
            <li key={h.id} className="space-y-2 rounded border p-4">
              {h.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={h.imageUrl} alt={h.name} className="h-40 w-full rounded object-cover" />
              )}
              <div className="flex items-baseline justify-between">
                <h2 className="font-medium">{h.name}</h2>
                <span className="text-sky-700">¥{h.price}/晚</span>
              </div>
              <p className="text-sm text-gray-500">{h.address} · {h.distance}</p>
              <RichText html={h.description} className="prose prose-sm max-w-none" />
            </li>
          ))}
        </ul>
      )}

      {hotels.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">提交预订申请</h2>
          <p className="text-sm text-gray-500">提交后可在个人中心查看审核状态(需登录)。</p>
          <BookingForm hotels={hotels.map((h) => ({ id: h.id, name: h.name, price: h.price }))} />
        </div>
      )}
    </section>
  );
}
