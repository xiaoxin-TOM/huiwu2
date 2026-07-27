import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { canAccessMeeting } from "@/lib/meetings";
import { getMaterialWithContext, deleteMaterial } from "@/lib/speaker-materials";
import { deleteSpeakerMaterialFromOSS } from "@/lib/oss";

/**
 * 删除材料。讲者本人只能删待审或被驳回的——已通过审核的材料可能已经挂在
 * 参会文件页或现场章程页上，会中突然消失比留着更糟；管理员不受此限。
 */
export async function DELETE(req: Request, ctx: RouteContext<"/api/speaker-materials/[id]">) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const material = await getMaterialWithContext(id);
  if (!material) {
    return NextResponse.json({ ok: false, error: "文件不存在" }, { status: 404 });
  }

  const admin = isAdmin(session?.user?.role) && (await canAccessMeeting(userId, material.speaker.meetingId));
  const isOwner = material.speaker.userId !== null && material.speaker.userId === userId;

  if (!admin) {
    if (!isOwner) {
      return NextResponse.json({ ok: false, error: "无权删除该文件" }, { status: 403 });
    }
    if (material.status === "APPROVED") {
      return NextResponse.json(
        { ok: false, error: "该资料已通过审核，如需撤回请联系管理员" },
        { status: 409 },
      );
    }
  }

  await deleteMaterial(id);
  // 数据库记录已删，OSS 清理失败不该让接口失败，留日志人工兜底
  try {
    await deleteSpeakerMaterialFromOSS(material.fileKey);
  } catch (error) {
    console.error("[material delete] 残留 OSS 对象:", material.fileKey, error);
  }

  return NextResponse.json({ ok: true });
}
