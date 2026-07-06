import Link from "next/link";
import { requireCurrentMeeting } from "@/lib/meetings";
import { listGuests } from "@/lib/guests-admin";
import AdminForm from "@/components/AdminForm";
import CopyInviteLinkButton from "@/components/CopyInviteLinkButton";

const LEVEL_OPTIONS = [
  { value: "ALL", label: "全部" },
  { value: "VIP", label: "VIP" },
  { value: "NORMAL", label: "嘉宾" },
  { value: "MEDIA", label: "媒体" },
];

const LEVEL_LABEL: Record<string, string> = {
  VIP: "VIP",
  NORMAL: "嘉宾",
  MEDIA: "媒体",
};

export default async function AdminGuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; q?: string }>;
}) {
  const meeting = await requireCurrentMeeting();
  const { level = "ALL", q = "" } = await searchParams;
  const guests = await listGuests(meeting.id, { level: level as "ALL" | "VIP" | "NORMAL" | "MEDIA", q });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">嘉宾管理</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/guests/import" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">
          </Link>
          <Link href="/admin/guests/new" className="rounded-lg bg-sky-700 px-3 py-1.5 text-sm text-white hover:bg-sky-800">
            + 新建嘉宾
          </Link>
        </div>
      </div>

      <form className="flex flex-wrap items-center gap-2" method="GET">
        {LEVEL_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={`/admin/guests?level=${opt.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-full px-3 py-1 text-sm ${level === opt.value ? "bg-sky-700 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            {opt.label}
          </Link>
        ))}
        <input
          name="q"
          defaultValue={q}
          placeholder="搜索姓名"
          className="ml-auto rounded-lg border px-3 py-1.5 text-sm"
        />
        <input type="hidden" name="level" value={level} />
        <button type="submit" className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">搜索</button>
      </form>

      {guests.length === 0 ? (
        <p className="text-gray-500">暂无嘉宾。</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="px-4 py-3">姓名</th>
                <th className="px-4 py-3">单位</th>
                <th className="px-4 py-3">级别</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => (
                <tr key={g.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{g.name}</td>
                  <td className="px-4 py-3 text-gray-500">{g.company || "-"}</td>
                  <td className="px-4 py-3">{LEVEL_LABEL[g.level] ?? g.level}</td>
                  <td className="px-4 py-3">
                    {g.confirmed ? (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">已确认</span>
                    ) : (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">待确认</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-xs">
                      <Link href={`/admin/guests/${g.id}/edit`} className="text-sky-700 hover:underline">编辑</Link>
                      <CopyInviteLinkButton token={g.token} />
                      <AdminForm action={`/api/admin/guests/${g.id}/delete`} redirectTo="/admin/guests" className="inline">
                        <button type="submit" className="text-red-600 hover:underline">删除</button>
                      </AdminForm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
