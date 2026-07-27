import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/access";
import { canAccessMeeting } from "@/lib/meetings";
import { getUserRegistration } from "@/lib/registrations";
import { reportLinkCookieName, verifyReportLinkCookie } from "@/lib/report-link-token";
import { getReportLinkByToken, reportLinkState } from "@/lib/report-links";
import type { MaterialViewer } from "@/lib/material-access";

/**
 * 把当前请求解析成一组候选身份，交给 canViewMaterialAsAny 裁决。
 *
 * reportToken 由页面显式传入（章程页生成的链接带 ?rl=<token>），
 * 服务端再用 rl_<hash> cookie 验证该链接的密码确实通过过。
 */
export async function resolveMaterialViewers(
  meetingId: string,
  options: { reportToken?: string | null } = {},
): Promise<MaterialViewer[]> {
  const viewers: MaterialViewer[] = [];

  const session = await auth();
  const userId = session?.user?.id;

  if (userId) {
    if (isAdmin(session?.user?.role) && (await canAccessMeeting(userId, meetingId))) {
      viewers.push({ kind: "admin", meetingId });
    }
    const registration = await getUserRegistration(userId, meetingId);
    viewers.push({
      kind: "user",
      userId,
      attendeeOfMeetingId: registration?.status === "APPROVED" ? meetingId : null,
    });
  } else {
    // 会议关闭实名要求时，未登录游客也能看公开材料
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { requireRealName: true },
    });
    viewers.push({ kind: "visitor", openMeetingId: meeting?.requireRealName === false ? meetingId : null });
  }

  const reportViewer = await resolveReportLinkViewer(options.reportToken);
  if (reportViewer) viewers.push(reportViewer);

  return viewers;
}

/** 校验汇报链接 token 与其密码 cookie；任一环节不过就返回 null */
export async function resolveReportLinkViewer(
  reportToken: string | null | undefined,
): Promise<MaterialViewer | null> {
  if (!reportToken) return null;

  const link = await getReportLinkByToken(reportToken);
  if (!link) return null;
  if (reportLinkState(link) !== "OK") return null;

  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  const jar = await cookies();
  const cookieValue = jar.get(reportLinkCookieName(link.token))?.value;
  if (!verifyReportLinkCookie(cookieValue, link.token, link.passwordHash, secret)) return null;

  return { kind: "reportLink", meetingId: link.meetingId };
}
