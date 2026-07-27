import { requirePublicMeeting, guardPublicAccess } from "@/lib/public-guard";
import { meetingHref } from "@/lib/public";
import { listApprovedMaterials, groupMaterialsBySchedule } from "@/lib/speaker-materials";
import { PageHeader } from "@/components/ui/PageHeader";
import MaterialScheduleList from "@/components/MaterialScheduleList";

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const params = await searchParams;
  const meeting = await requirePublicMeeting(params.m);
  await guardPublicAccess(meeting.id);

  // 只取审核通过的公开材料；保密材料不出现在参会用户的目录里
  const days = groupMaterialsBySchedule(await listApprovedMaterials(meeting.id));

  return (
    <div className="space-y-4">
      <PageHeader title="参会文件" backHref={meetingHref(meeting.id, "/")} />
      <MaterialScheduleList
        days={days}
        hrefForSession={(sessionId) => meetingHref(meeting.id, `/materials/${sessionId}`)}
        emptyHint="暂无已公开的参会文件，请稍后再来查看。"
      />
    </div>
  );
}
