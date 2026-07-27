import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessMeeting } from "@/lib/meetings";
import { getMaterialWithContext } from "@/lib/speaker-materials";
import { MATERIAL_STATUS_LABEL } from "@/types/material";
import MaterialPreview from "@/components/MaterialPreview";
import MaterialReviewButtons from "@/components/MaterialReviewButtons";
import { ButtonLink } from "@/components/ui/Button";

export default async function AdminMaterialPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const material = await getMaterialWithContext(id);
  if (!material) notFound();

  // 会议隔离：不是自己有权访问的会议就当不存在，不泄漏是否存在该 id
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || !(await canAccessMeeting(userId, material.speaker.meetingId))) notFound();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">查阅讲者资料</h1>
          <p className="text-sm text-gray-500">
            {material.speaker.name} · {material.session.day} {material.session.startTime}-
            {material.session.endTime} · {material.session.title}
          </p>
        </div>
        <ButtonLink href="/admin/submissions?tab=materials" variant="secondary" size="sm">
          ← 返回审核列表
        </ButtonLink>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
        <span className="text-sm text-gray-500">
          当前状态：
          <span className="font-medium text-slate-800">
            {MATERIAL_STATUS_LABEL[material.status] ?? material.status}
          </span>
        </span>
        {material.isConfidential && (
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">保密材料</span>
        )}
        <MaterialReviewButtons id={material.id} status={material.status} />
      </div>

      <MaterialPreview
        material={{
          id: material.id,
          fileName: material.fileName,
          fileSize: material.fileSize,
          mimeType: material.mimeType,
          isConfidential: material.isConfidential,
          speakerName: material.speaker.name,
        }}
      />
    </div>
  );
}
