import Link from "next/link";
import AdminForm from "@/components/AdminForm";

export default function NewChannelPage() {
  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/admin/channels" className="text-sm text-sky-700 hover:underline">
          ← 返回
        </Link>
        <h1 className="text-2xl font-bold">新建渠道</h1>
      </div>
      <AdminForm
        action="/api/admin/channels"
        redirectTo="/admin/channels"
        className="space-y-4 rounded-xl bg-white p-5 shadow-sm"
      >
        <div>
          <label className="block text-sm text-gray-600">渠道名称 *</label>
          <input name="name" required className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">短码 *</label>
          <input name="code" required minLength={2} maxLength={40} className="mt-1 w-full rounded-lg border px-3 py-2" />
          <p className="mt-1 text-xs text-gray-400">用于专属链接 /register-conf?ch=短码，会议内唯一</p>
        </div>
        <div>
          <label className="block text-sm text-gray-600">负责人</label>
          <input name="owner" className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">备注</label>
          <textarea name="note" rows={3} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <button type="submit" className="rounded-lg bg-sky-700 px-4 py-2 text-white hover:bg-sky-800">
          保存
        </button>
      </AdminForm>
    </div>
  );
}
