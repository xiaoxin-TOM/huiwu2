import { requireUser } from "@/lib/session";
import { listUserSubmissions } from "@/lib/submissions";
import { resolveMeeting } from "@/lib/meetings";
import { meetingHref } from "@/lib/public";
import SubmissionForm from "@/components/SubmissionForm";
import { STATUS_LABEL } from "@/lib/labels";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard, DataCard, IconCard } from "@/components/ui/Card";
import { FileEditIcon, CalendarIcon, UsersIcon, FileTextIcon } from "@/components/icons";

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const user = await requireUser();
  const meeting = await resolveMeeting((await searchParams).m);
  const subs = await listUserSubmissions(user.id, meeting.id);

  return (
    <div className="space-y-4">
      <PageHeader title={`${meeting.title} · 论文提交`} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <IconCard href={meetingHref(meeting.id, "/schedule")} title="会议日程" icon={<CalendarIcon className="h-6 w-6" />} />
        <IconCard href={meetingHref(meeting.id, "/speakers")} title="讲者查询" icon={<UsersIcon className="h-6 w-6" />} />
        <IconCard href={meetingHref(meeting.id, "/register-conf")} title="会议报名" icon={<FileTextIcon className="h-6 w-6" />} />
        <IconCard href={meetingHref(meeting.id, "/")} title="返回首页" icon={<FileEditIcon className="h-6 w-6" />} />
      </div>

      <SectionCard title="我的投稿">
        {subs.length === 0 ? (
          <p className="text-sm text-slate-500">暂无投稿。</p>
        ) : (
          <div className="grid gap-3">
            {subs.map((s) => (
              <DataCard
                key={s.id}
                title={s.title}
                meta={STATUS_LABEL[s.status] ?? s.status}
                description={s.authors}
                icon={<FileEditIcon className="h-6 w-6" />}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="提交新论文">
        <SubmissionForm meetingId={meeting.id} />
      </SectionCard>
    </div>
  );
}
