import { notFound } from "next/navigation";
import { getSpeakerById } from "@/lib/speakers";

export default async function EditSpeakerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSpeakerById(id);
  if (!s) notFound();
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">编辑讲者</h1>
      <form action={`/api/admin/speakers/${s.id}`} method="post" className="space-y-3">
        <input name="name" required defaultValue={s.name} className="w-full rounded border px-3 py-2" />
        <input name="title" defaultValue={s.title} placeholder="职称" className="w-full rounded border px-3 py-2" />
        <input name="organization" defaultValue={s.organization} placeholder="单位" className="w-full rounded border px-3 py-2" />
        <input name="photoUrl" defaultValue={s.photoUrl ?? ""} placeholder="照片地址" className="w-full rounded border px-3 py-2" />
        <textarea name="bio" rows={5} defaultValue={s.bio} className="w-full rounded border px-3 py-2 font-mono text-sm" />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" name="isModerator" defaultChecked={s.isModerator} /> 主持人
        </label>
        <button type="submit" className="rounded bg-sky-700 px-4 py-2 text-white">保存</button>
      </form>
    </div>
  );
}
