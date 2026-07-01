import { listHotels } from "@/lib/hotels";
import BookingForm from "@/components/BookingForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard, DataCard } from "@/components/ui/Card";
import { HotelIcon } from "@/components/icons";

export default async function HotelsPage() {
  const hotels = await listHotels();
  return (
    <div className="space-y-5">
      <PageHeader title="酒店预订" />

      {hotels.length === 0 ? (
        <p className="text-slate-500">暂无酒店信息。</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {hotels.map((h) => (
              <DataCard
                key={h.id}
                title={h.name}
                meta={`¥${h.price}/晚 · ${h.distance}`}
                description={h.address}
                htmlDescription={h.description}
                imageUrl={h.imageUrl}
                icon={<HotelIcon className="h-6 w-6" />}
              />
            ))}
          </div>

          <SectionCard title="提交预订申请">
            <p className="mb-4 text-sm text-slate-500">提交后可在个人中心查看审核状态（需登录）。</p>
            <BookingForm hotels={hotels.map((h) => ({ id: h.id, name: h.name, price: h.price }))} />
          </SectionCard>
        </>
      )}
    </div>
  );
}
