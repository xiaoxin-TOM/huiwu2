import { notFound } from "next/navigation";
import { getReportLinkByToken, reportLinkState } from "@/lib/report-links";
import { resolveReportLinkViewer } from "@/lib/material-viewer";
import { listApprovedMaterials, groupMaterialsBySchedule } from "@/lib/speaker-materials";
import MaterialScheduleList from "@/components/MaterialScheduleList";
import ReportLinkGate from "@/components/ReportLinkGate";

/** 会议章程页：结构化日程 + 每场的「进入」按钮，进入后展示该场讲者的材料。 */
export default async function ReportLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await getReportLinkByToken(token);
  if (!link) notFound();

  const state = reportLinkState(link);
  if (state !== "OK") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold text-slate-800">{link.meeting.title}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {state === "EXPIRED" ? "该汇报链接已过期。" : "该汇报链接已停用。"}
          </p>
          <p className="mt-1 text-xs text-slate-400">请联系会议管理员重新获取。</p>
        </div>
      </div>
    );
  }

  // 密码未通过时只渲染闸口，不查询任何材料
  const viewer = await resolveReportLinkViewer(token);
  if (!viewer) {
    return <ReportLinkGate token={token} meetingTitle={link.meeting.title} />;
  }

  // 汇报链接可看全部已过审材料，含保密
  const days = groupMaterialsBySchedule(await listApprovedMaterials(link.meetingId, true));

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto max-w-4xl space-y-5 px-4">
        <header className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-800">{link.meeting.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {link.meeting.startDate}
            {link.meeting.endDate && ` ~ ${link.meeting.endDate}`}
            {link.meeting.location && ` · ${link.meeting.location}`}
          </p>
          {link.name && <p className="mt-2 text-xs text-sky-700">汇报入口：{link.name}</p>}
        </header>

        <MaterialScheduleList
          days={days}
          hrefForSession={(sessionId) => `/p/${token}/s/${sessionId}`}
          emptyHint="暂无已通过审核的讲者材料。"
        />
      </div>
    </div>
  );
}
