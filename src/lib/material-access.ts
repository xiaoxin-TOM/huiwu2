/**
 * 讲者材料的访问控制——纯函数，不碰数据库与 Next 运行时，可完整单测。
 *
 * 调用方负责把身份解析成 MaterialViewer（包括查库确认管理员的会议访问权、
 * 用户的报名状态、汇报链接的密码与有效期），本模块只做最终裁决。
 */

export type MaterialStatus = "PENDING" | "APPROVED" | "REJECTED";

export type MaterialFacts = {
  meetingId: string;
  status: MaterialStatus;
  isConfidential: boolean;
  /** 材料所属讲者绑定的用户 id；讲者尚未认领邀约时为 null */
  speakerUserId: string | null;
};

export type MaterialViewer =
  /** 管理员；meetingId 是已通过 canAccessMeeting 校验的那个会议 */
  | { kind: "admin"; meetingId: string }
  /** 已登录用户；attendeeOfMeetingId 为其已通过审核的报名所属会议 */
  | { kind: "user"; userId: string; attendeeOfMeetingId: string | null }
  /** 汇报链接持有者；meetingId 来自已验证 token 与密码的链接 */
  | { kind: "reportLink"; meetingId: string }
  /** 未登录游客；openMeetingId 仅在会议关闭实名要求时有值 */
  | { kind: "visitor"; openMeetingId: string | null };

function isPubliclyReadable(facts: MaterialFacts): boolean {
  return facts.status === "APPROVED" && !facts.isConfidential;
}

/**
 * 一个请求可能同时具备多重身份（例如管理员又带着汇报链接），
 * 任一身份放行即可访问。
 */
export function canViewMaterialAsAny(facts: MaterialFacts, viewers: MaterialViewer[]): boolean {
  return viewers.some((viewer) => canViewMaterial(facts, viewer));
}

export function canViewMaterial(facts: MaterialFacts, viewer: MaterialViewer): boolean {
  switch (viewer.kind) {
    case "admin":
      return viewer.meetingId === facts.meetingId;

    case "user":
      // 讲者本人：自己上传的材料任何状态都能看，包括保密与被驳回的
      if (facts.speakerUserId !== null && facts.speakerUserId === viewer.userId) return true;
      return viewer.attendeeOfMeetingId === facts.meetingId && isPubliclyReadable(facts);

    case "reportLink":
      // 现场大屏要放讲者的 PPT，保密稿也必须能开；但未过审的一律不给
      return viewer.meetingId === facts.meetingId && facts.status === "APPROVED";

    case "visitor":
      return viewer.openMeetingId === facts.meetingId && isPubliclyReadable(facts);
  }
}
