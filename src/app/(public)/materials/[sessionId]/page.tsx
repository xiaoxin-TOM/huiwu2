import { notFound } from "next/navigation";
import { requirePublicMeeting, guardPublicAccess } from "@/lib/public-guard";
import { meetingHref } from "@/lib/public";
import { listApprovedMaterials } from "@/lib/speaker-materials";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";
import MaterialPreview from "@/components/MaterialPreview";

export default async function SessionMaterialsPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const { sessionId } = await params;
  const meeting = await requirePublicMeeting((await searchParams).m);
  await guardPublicAccess(meeting.id);

  const materials = (await listApprovedMaterials(meeting.id)).filter((m) => m.sessionId === sessionId);
  if (materials.length === 0) notFound();

  const session = materials[0].session;

  return (
    <div className="space-y-4">
      <PageHeader
        title={session.title}
        backHref={meetingHref(meeting.id, "/materials")}
      />
      <p className="text-sm text-slate-500">
        {session.day} {session.startTime}-{session.endTime}
        {session.room && ` · ${session.room}`}
      </p>

      {materials.map((m) => (
        <SectionCard key={m.id} title={m.speaker.name}>
          <MaterialPreview
            material={{
              id: m.id,
              fileName: m.fileName,
              fileSize: m.fileSize,
              mimeType: m.mimeType,
              isConfidential: m.isConfidential,
              speakerName: m.speaker.name,
            }}
          />
        </SectionCard>
      ))}
    </div>
  );
}
