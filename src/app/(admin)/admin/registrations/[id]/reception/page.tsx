import { notFound } from "next/navigation";
import { getRegistrationWithReception } from "@/lib/registrations";
import AdminForm from "@/components/AdminForm";
import { ButtonLink } from "@/components/ui/Button";

export default async function EditRegistrationReceptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reg = await getRegistrationWithReception(id);
  if (!reg) notFound();
  const r = reg.reception;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <ButtonLink href="/admin/receptions" variant="secondary" size="sm">
          ← 返回接待管理
        </ButtonLink>
        <h1 className="text-2xl font-bold">编辑报名人员接待信息</h1>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-medium">基本信息</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500">姓名</dt>
            <dd className="font-medium">{reg.fullName}</dd>
          </div>
          <div>
            <dt className="text-gray-500">参会类型</dt>
            <dd className="font-medium">{reg.type.name}</dd>
          </div>
          <div>
            <dt className="text-gray-500">单位</dt>
            <dd className="font-medium">{reg.organization || "-"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">手机</dt>
            <dd className="font-medium">{reg.phone || "-"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">邮箱</dt>
            <dd className="font-medium">{reg.user.email}</dd>
          </div>
        </dl>
      </div>

      <AdminForm
        action={`/api/admin/registrations/${reg.id}/reception`}
        redirectTo="/admin/receptions"
        className="space-y-4 rounded-xl bg-white p-5 shadow-sm"
      >
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
