import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { getBadgeTemplate, renderBadgePdf } from "@/lib/badge-template";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return new Response(JSON.stringify({ ok: false, error: "无权限" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const meeting = await requireCurrentMeetingForRequest(req);
  const template = await getBadgeTemplate(meeting.id);

  const sampleRegistration = {
    fullName: "张三",
    title: "高级工程师",
    organization: "示例科技有限公司",
    token: "sample-token-0000",
  };

  const pdf = await renderBadgePdf(sampleRegistration, meeting, template);

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="badge-preview.pdf"`,
    },
  });
}
