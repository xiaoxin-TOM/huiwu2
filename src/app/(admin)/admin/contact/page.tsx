import { requireCurrentMeeting } from "@/lib/meetings";
import { getMeetingContact } from "@/lib/feedback";
import AdminForm from "@/components/AdminForm";
import ImageUploadField from "@/components/ImageUploadField";

const QR_FIELDS = [
  { url: "wecomQrUrl", note: "wecomNote", label: "企业微信客服码", hint: "如：工作日 9:00-18:00 在线" },
  { url: "groupQrUrl", note: "groupNote", label: "微信交流群码", hint: "如：群二维码 7 天更换一次" },
  { url: "mpQrUrl", note: "mpNote", label: "公众号二维码", hint: "如：关注获取最新会议动态" },
] as const;

export default async function AdminContactPage() {
  const meeting = await requireCurrentMeeting();
  const contact = await getMeetingContact(meeting.id);

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">联系方式</h1>
        <p className="text-sm text-gray-500">
          当前会议：{meeting.title} · 填写后展示在前台「联系方式」页顶部，留空则该项不显示
        </p>
      </div>

      <AdminForm action="/api/admin/contact" redirectTo="/admin/contact" className="space-y-5 rounded-xl bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-gray-600">主办方名称</label>
            <input name="orgName" defaultValue={contact?.orgName ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">联系电话</label>
            <input name="phone" defaultValue={contact?.phone ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">备用电话</label>
            <input name="phone2" defaultValue={contact?.phone2 ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">邮箱</label>
            <input name="email" defaultValue={contact?.email ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">微信号</label>
            <input name="wechatId" defaultValue={contact?.wechatId ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">地址</label>
            <input name="address" defaultValue={contact?.address ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <h2 className="font-medium">客服与社群二维码</h2>
          {QR_FIELDS.map((f) => (
            <div key={f.url} className="grid gap-3 sm:grid-cols-2">
              <ImageUploadField
                name={f.url}
                label={f.label}
                defaultValue={(contact?.[f.url] as string | null) ?? ""}
              />
              <div>
                <label className="block text-sm text-gray-600">说明文字</label>
                <input
                  name={f.note}
                  defaultValue={(contact?.[f.note] as string | undefined) ?? ""}
                  placeholder={f.hint}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </div>
            </div>
          ))}
        </div>

        <button type="submit" className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800">
          保存
        </button>
      </AdminForm>
    </div>
  );
}
