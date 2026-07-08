import { notFound } from "next/navigation";
import { getGuestById } from "@/lib/guests-admin";
import AdminForm from "@/components/AdminForm";
import { ButtonLink } from "@/components/ui/Button";

export default async function EditGuestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guest = await getGuestById(id);
  if (!guest) notFound();
  const r = guest.reception;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <ButtonLink href="/admin/guests" variant="secondary" size="sm">
          ← 返回
        </ButtonLink>
        <h1 className="text-2xl font-bold">编辑嘉宾</h1>
      </div>
      <AdminForm action={`/api/admin/guests/${guest.id}`} redirectTo="/admin/guests" className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-medium">基本信息</h2>
        <div>
          <label className="block text-sm text-gray-600">姓名 *</label>
          <input name="name" required defaultValue={guest.name} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600">手机</label>
            <input name="phone" defaultValue={guest.phone ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">邮箱</label>
            <input name="email" type="email" defaultValue={guest.email ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600">单位</label>
            <input name="company" defaultValue={guest.company} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">职位</label>
            <input name="title" defaultValue={guest.title} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600">级别</label>
          <select name="level" defaultValue={guest.level} className="mt-1 w-full rounded-lg border px-3 py-2">
            <option value="VIP">VIP</option>
            <option value="NORMAL">嘉宾</option>
            <option value="MEDIA">媒体</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600">简介</label>
          <textarea name="bio" rows={3} defaultValue={guest.bio} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">备注</label>
          <textarea name="note" rows={2} defaultValue={guest.note} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">座位信息</label>
          <input name="seatInfo" defaultValue={guest.seatInfo} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>

        <hr className="border-slate-200" />
        <h2 className="font-medium">接待信息</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600">抵达方式</label>
            <input name="arriveMode" defaultValue={r?.arriveMode ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">抵达班次</label>
            <input name="arriveNo" defaultValue={r?.arriveNo ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">抵达时间</label>
            <input name="arriveTime" defaultValue={r?.arriveTime ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">抵达地点</label>
            <input name="arrivePlace" defaultValue={r?.arrivePlace ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600">返程方式</label>
            <input name="departMode" defaultValue={r?.departMode ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">返程班次</label>
            <input name="departNo" defaultValue={r?.departNo ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">返程时间</label>
            <input name="departTime" defaultValue={r?.departTime ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600">酒店名称</label>
            <input name="hotelName" defaultValue={r?.hotelName ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">房间号</label>
            <input name="hotelRoom" defaultValue={r?.hotelRoom ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">入住日期</label>
            <input name="hotelCheckIn" defaultValue={r?.hotelCheckIn ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">退房日期</label>
            <input name="hotelCheckOut" defaultValue={r?.hotelCheckOut ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600">车牌号</label>
            <input name="carPlate" defaultValue={r?.carPlate ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">司机</label>
            <input name="carDriver" defaultValue={r?.carDriver ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">司机电话</label>
            <input name="carDriverPhone" defaultValue={r?.carDriverPhone ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">接待联系人</label>
            <input name="carContact" defaultValue={r?.carContact ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600">接待备注</label>
          <textarea name="remark" rows={2} defaultValue={r?.remark ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>

        <button type="submit" className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800">
          保存
        </button>
      </AdminForm>
    </div>
  );
}
