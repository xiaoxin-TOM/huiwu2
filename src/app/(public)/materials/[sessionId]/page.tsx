import { notFound } from "next/navigation";
import { requirePublicMeeting, guardPublicAccess } from "@/lib/public-guard";
import { meetingHref } from "@/lib/public";
import { listApprovedMaterials } from "@/lib/speaker-materials";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";

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

      {/* 只列文件清单，不做浏览器内联预览：Office 文件的端上渲染对复杂排版支持有限，统一下载原文查看 */}
      <SectionCard title="会议资料">
        <div className="divide-y">
          {materials.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-medium text-slate-800">
                  <span className="truncate">{m.fileName}</span>
                  {m.isConfidential && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">保密</span>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {m.speaker.name} · {(m.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <a
                href={`/api/materials/${m.id}/file?download=1`}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                下载查看原文
              </a>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
