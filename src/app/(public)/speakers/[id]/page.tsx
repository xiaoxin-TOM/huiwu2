import { notFound } from "next/navigation";
import { getSpeakerById } from "@/lib/speakers";
import RichText from "@/components/RichText";

export default async function SpeakerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const s = await getSpeakerById(id);
  if (!s) notFound();
  return (
    <article className="space-y-3">
      <h1 className="text-2xl font-bold">{s.name}</h1>
      <p className="text-gray-500">
        {s.title} · {s.organization}
        {s.isModerator && " · 主持人"}
      </p>
      <RichText html={s.bio} />
    </article>
  );
}
