import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserRegistration } from "@/lib/registrations";
import { getPublicMeetingFromCookie } from "@/lib/meetings";
import { isAdmin } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import type { Meeting } from "@prisma/client";

export async function requirePublicMeeting(meetingId?: string | null): Promise<Meeting> {
  if (meetingId) {
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (meeting) return meeting;
  }
  const cookieMeeting = await getPublicMeetingFromCookie();
  if (cookieMeeting) return cookieMeeting;
  redirect("/register-conf");
}

export async function guardPublicAccess(meetingId: string, options?: { allowPending?: boolean }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { requireRealName: true },
    });
    // 会议未要求实名时，未登录的游客可直接浏览
    if (meeting?.requireRealName === false) return;
    const h = await headers();
    const pathname = h.get("x-pathname") || `/m/${meetingId}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  }
  if (isAdmin(session.user.role)) return;

  const registration = await getUserRegistration(userId, meetingId);
  if (!registration) {
    redirect(`/r/${meetingId}`);
  }
  if (!options?.allowPending && registration.status !== "APPROVED") {
    redirect(`/m/${meetingId}/me`);
  }
}
