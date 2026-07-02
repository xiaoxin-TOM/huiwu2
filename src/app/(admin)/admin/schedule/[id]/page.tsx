import { notFound } from "next/navigation";
import { getSessionAdmin } from "@/lib/schedule-admin";
import { getAllSpeakers } from "@/lib/speakers";

const ROLE_LABEL: Record<string, string> = { SPEAKER: "讲者", MODERATOR: "主持人" };

export default async function EditSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [sess, speakers] = await Promise.all([getSessionAdmin(id), getAllSpeakers()]);
  if (!sess) notFound();
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">编辑场次</h1>

      <form action={`/api/admin/sessions/${sess.id}`} method="post" className="space-y-3 rounded border p-4">
        <input name="day" type="date" required defaultValue={sess.day} className="w-full rounded border px-3 py-2" />
        <div className="flex gap-2">
          <input name="startTime" required defaultValue={sess.startTime} placeholder="开始" className="w-full rounded border px-3 py-2" />
          <input name="endTime" required defaultValue={sess.endTime} placeholder="结束" className="w-full rounded border px-3 py-2" />
        </div>
        <input name="room" defaultValue={sess.room} placeholder="会场" className="w-full rounded border px-3 py-2" />
        <input name="title" required defaultValue={sess.title} placeholder="标题" className="w-full rounded border px-3 py-2" />
        <button type="submit" className="rounded bg-sky-700 px-4 py-2 text-white">保存场次</button>
      </form>

      <div className="space-y-3 rounded border p-4">
        <h2 className="font-medium">讲者 / 主持人</h2>
        {sess.speakers.length === 0 ? (
          <p className="text-sm text-gray-500">尚未指派。</p>
        ) : (
          <ul className="divide-y">
            {sess.speakers.map((x) => (
              <li key={`${x.speakerId}-${x.role}`} className="flex items-center gap-3 py-2 text-sm">
                <span>{x.speaker.name}</span>
                <span className="text-gray-400">{ROLE_LABEL[x.role] ?? x.role}</span>
                <form action={`/api/admin/sessions/${sess.id}/speakers/delete`} method="post" className="ml-auto">
                  <input type="hidden" name="speakerId" value={x.speakerId} />
                  <input type="hidden" name="role" value={x.role} />
                  <button type="submit" className="text-red-600 hover:underline">撤销</button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={`/api/admin/sessions/${sess.id}/speakers`} method="post" className="flex flex-wrap items-center gap-2">
          <select name="speakerId" required className="rounded border px-2 py-1.5 text-sm">
            <option value="">选择讲者</option>
            {speakers.map((sp) => (
              <option key={sp.id} value={sp.id}>{sp.name}</option>
            ))}
          </select>
          <select name="role" className="rounded border px-2 py-1.5 text-sm">
            <option value="SPEAKER">讲者</option>
            <option value="MODERATOR">主持人</option>
          </select>
          <button type="submit" className="rounded bg-green-600 px-3 py-1.5 text-sm text-white">指派</button>
        </form>
      </div>
    </div>
  );
}
