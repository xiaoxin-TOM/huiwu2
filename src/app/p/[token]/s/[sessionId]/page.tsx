import Link from "next/link";
import { notFound } from "next/navigation";
import { getReportLinkByToken, reportLinkState } from "@/lib/report-links";
import { resolveReportLinkViewer } from "@/lib/material-viewer";
import { listApprovedMaterials } from "@/lib/speaker-materials";
import MaterialPreview from "@/components/MaterialPreview";
import { ArrowLeftIcon } from "@/components/icons";

/** 汇报展示页：放某一场日程下所有已过审材料（含保密），供现场大屏使用。 */
export default async function ReportSessionPage({
  params,
}: {
  params: Promise<{ token: string; sessionId: string }>;
}) {
  const { token, sessionId } = await params;
  const link = await getReportLinkByToken(token);
  if (!link || reportLinkState(link) !== "OK") notFound();

  const viewer = await resolveReportLinkViewer(token);
  // 未通过密码闸口的一律回到入口页，不在此处暴露任何材料信息
  if (!viewer) notFound();

  const materials = (await listApprovedMaterials(link.meetingId, true)).filter(
    (m) => m.sessionId === sessionId,
  );
  if (materials.length === 0) notFound();

  const session = materials[0].session;

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto max-w-5xl space-y-4 px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{session.title}</h1>
            <p className="text-sm text-slate-500">
              {session.day} {session.startTime}-{session.endTime}
              {session.room && ` · ${session.room}`}
            </p>
          </div>
          <Link
            href={`/p/${token}`}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" /> 返回章程
          </Link>
        </div>

        {materials.map((m) => (
          <div key={m.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <MaterialPreview
              material={{
                id: m.id,
                fileName: m.fileName,
                fileSize: m.fileSize,
                mimeType: m.mimeType,
                isConfidential: m.isConfidential,
                speakerName: m.speaker.name,
              }}
              reportToken={token}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
