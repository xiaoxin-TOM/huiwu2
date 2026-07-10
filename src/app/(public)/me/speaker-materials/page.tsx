import Link from "next/link";
import { requireUser } from "@/lib/session";
import { resolveMeeting } from "@/lib/meetings";
import { getSpeakerByUserId } from "@/lib/speakers-admin";
import { getSpeakerSessions } from "@/lib/speakers";
import { listSpeakerMaterials } from "@/lib/speaker-materials";
import { meetingHref } from "@/lib/public";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";
import SpeakerMaterialUploadForm from "@/components/SpeakerMaterialUploadForm";
import { ArrowLeftIcon } from "@/components/icons";

export default async function SpeakerMaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const user = await requireUser();
  const meeting = await resolveMeeting((await searchParams).m);
  const speaker = await getSpeakerByUserId(user.id, meeting.id);
  if (!speaker) {
    return (
      <div className="space-y-4">
        <PageHeader title="上传报告资料" />
        <p className="text-slate-500">您当前不是认证讲者，无法接受邀约后上传资料。</p>
        <Link href={meetingHref(meeting.id, "/me")} className="inline-flex items-center text-sky-700 hover:underline">
          <ArrowLeftIcon className="mr-1 h-4 w-4" /> 返回个人中心
        </Link>
      </div>
    );
  }

  const [sessions, materials] = await Promise.all([
    getSpeakerSessions(speaker.id, meeting.id),
    listSpeakerMaterials(speaker.id),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="上传报告资料"
        action={
          <Link
            href={meetingHref(meeting.id, "/me")}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" /> 返回个人中心
          </Link>
        }
      />

      <SectionCard title="上传新资料">
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-500">当前暂无关联日程，请联系管理员为您分配日程。</p>
        ) : (
          <SpeakerMaterialUploadForm sessions={sessions} meetingId={meeting.id} />
        )}
      </SectionCard>

      <SectionCard title="已上传资料">
        {materials.length === 0 ? (
          <p className="text-sm text-slate-500">尚未上传任何资料。</p>
        ) : (
          <div className="divide-y">
            {materials.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-800">{m.fileName}</p>
                  <p className="text-xs text-slate-500">
                    {m.session.day} {m.session.startTime}-{m.session.endTime} · {m.session.title} ·{" "}
                    {(m.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <a
                  href={m.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  查看
                </a>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
