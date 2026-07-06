import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { requireCurrentMeetingForRequest } from "@/lib/meetings";
import { prisma } from "@/lib/prisma";
import { getBadgeTemplate, renderBadgesPdf } from "@/lib/badge-template";

export async function GET(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return new Response(JSON.stringify({ ok: false, error: "无权限" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const meeting = await requireCurrentMeetingForRequest(req);
  const [template, registrations] = await Promise.all([
    getBadgeTemplate(meeting.id),
    prisma.registration.findMany({
      where: {
        meetingId: meeting.id,
        status: { not: "REJECTED" },
      },
      select: {
        fullName: true,
        organization: true,
        title: true,
        token: true,
      },
      orderBy: { fullName: "asc" },
    }),
  ]);

  if (registrations.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: "没有可导出的报名者" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const pdf = await renderBadgesPdf(registrations, meeting, template);

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="badges-${meeting.id}.pdf"`,
    },
  });
}
