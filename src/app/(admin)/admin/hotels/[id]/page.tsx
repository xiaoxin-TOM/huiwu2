import { notFound } from "next/navigation";
import { getHotel } from "@/lib/hotels";
import AdminForm from "@/components/AdminForm";
import ImageUploadField from "@/components/ImageUploadField";

export default async function EditHotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const h = await getHotel(id);
  if (!h) notFound();
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">编辑酒店</h1>
      <AdminForm action={`/api/admin/hotels/${h.id}`} redirectTo="/admin/hotels" className="space-y-3">
        <input name="name" required defaultValue={h.name} className="w-full rounded border px-3 py-2" />
        <input name="price" type="number" min={0} defaultValue={h.price} className="w-full rounded border px-3 py-2" />
        <input name="address" defaultValue={h.address} placeholder="地址" className="w-full rounded border px-3 py-2" />
        <input name="distance" defaultValue={h.distance} placeholder="距离" className="w-full rounded border px-3 py-2" />
        <ImageUploadField name="imageUrl" defaultValue={h.imageUrl ?? ""} label="酒店图片" />
        <label className="block text-sm text-gray-600">酒店介绍（纯文本，换行自动分段）
          <textarea name="description" rows={4} defaultValue={h.description} className="mt-1 w-full rounded border px-3 py-2 text-sm" />
        </label>
        <button type="submit" className="rounded bg-sky-700 px-4 py-2 text-white">保存</button>
      </AdminForm>
    </div>
  );
}
