import Link from "next/link";
import { listSubmissions } from "@/lib/submissions";
import { listMeetingMaterials, countPendingMaterials } from "@/lib/speaker-materials";
import { listReportLinks, reportLinkState } from "@/lib/report-links";
import { requireCurrentMeeting } from "@/lib/meetings";
import { STATUS_LABEL } from "@/lib/labels";
import { MATERIAL_STATUS_LABEL } from "@/types/material";
import AdminForm from "@/components/AdminForm";
import MaterialReviewButtons from "@/components/MaterialReviewButtons";
import ReportLinkManager from "@/components/ReportLinkManager";
import { ButtonLink } from "@/components/ui/Button";

type Tab = "papers" | "materials";

function ReviewButtons({ id }: { id: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <AdminForm action={`/api/admin/submissions/${id}`} redirectTo="/admin/submissions">
        <input type="hidden" name="decision" value="APPROVED" />
        <button type="submit" className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700">
          通过
        </button>
      </AdminForm>
      <AdminForm action={`/api/admin/submissions/${id}`} redirectTo="/admin/submissions">
        <input type="hidden" name="decision" value="REJECTED" />
        <button type="submit" className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700">
          拒绝
        </button>
      </AdminForm>
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "text-slate-600",
  APPROVED: "text-emerald-700",
  REJECTED: "text-red-600",
};

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const meeting = await requireCurrentMeeting();
  const tab: Tab = (await searchParams).tab === "materials" ? "materials" : "papers";

  const [subs, materials, pendingCount, links] = await Promise.all([
    listSubmissions(meeting.id),
    listMeetingMaterials(meeting.id),
    countPendingMaterials(meeting.id),
    listReportLinks(meeting.id),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">投稿审核</h1>
          <p className="text-sm text-gray-500">当前会议：{meeting.title}</p>
        </div>
        {tab === "papers" && (
          <ButtonLink href="/api/admin/submissions/export" download variant="secondary" size="sm">
            导出 CSV
          </ButtonLink>
        )}
      </div>

      <div className="flex gap-1 border-b">
        <Link
          href="/admin/submissions"
          className={`px-4 py-2 text-sm font-medium ${
            tab === "papers" ? "border-b-2 border-sky-700 text-sky-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          论文投稿
        </Link>
        <Link
          href="/admin/submissions?tab=materials"
          className={`px-4 py-2 text-sm font-medium ${
            tab === "materials" ? "border-b-2 border-sky-700 text-sky-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          讲者资料
          {pendingCount > 0 && (
            <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">{pendingCount}</span>
          )}
        </Link>
      </div>

      {tab === "papers" ? (
        subs.length === 0 ? (
          <p className="text-gray-500">暂无投稿。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2">论文题目</th><th>作者</th><th>投稿人</th><th>状态</th><th>文件</th><th>操作</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-b">
                    <td className="py-2">{s.title}</td>
                    <td>{s.authors}</td>
                    <td>{s.user.email}</td>
                    <td className="text-sky-700">{STATUS_LABEL[s.status] ?? s.status}</td>
                    <td>
                      {s.fileUrl ? (
                        <a href={s.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-700 hover:underline">下载</a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td><ReviewButtons id={s.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="space-y-6">
          <ReportLinkManager
            links={links.map((l) => ({
              id: l.id,
              token: l.token,
              name: l.name,
              isActive: l.isActive,
              expiresAt: l.expiresAt ? l.expiresAt.toISOString().slice(0, 16).replace("T", " ") : null,
              state: reportLinkState(l),
            }))}
          />

          {materials.length === 0 ? (
            <p className="text-gray-500">暂无讲者上传的资料。</p>
          ) : (
            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="px-4 py-3">讲者</th>
                    <th className="px-4 py-3">日程</th>
                    <th className="px-4 py-3">文件</th>
                    <th className="px-4 py-3">属性</th>
                    <th className="px-4 py-3">状态</th>
                    <th className="px-4 py-3">查阅</th>
                    <th className="px-4 py-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m) => (
                    <tr key={m.id} className="border-b">
                      <td className="px-4 py-3 font-medium">{m.speaker.name}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {m.session.day} {m.session.startTime}-{m.session.endTime}
                        {m.session.room && ` · ${m.session.room}`}
                        <span className="block text-xs">{m.session.title}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block max-w-[16rem] truncate">{m.fileName}</span>
                        <span className="text-xs text-gray-400">{(m.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                      </td>
                      <td className="px-4 py-3">
                        {m.isConfidential ? (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">保密</span>
                        ) : (
                          <span className="text-xs text-gray-500">公开</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 ${STATUS_STYLE[m.status] ?? ""}`}>
                        {MATERIAL_STATUS_LABEL[m.status] ?? m.status}
                        {m.status === "REJECTED" && m.reviewNote && (
                          <span className="block text-xs text-gray-400">{m.reviewNote}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ButtonLink href={`/admin/materials/${m.id}`} variant="secondary" size="xs">
                          预览
                        </ButtonLink>
                      </td>
                      <td className="px-4 py-3">
                        <MaterialReviewButtons id={m.id} status={m.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
