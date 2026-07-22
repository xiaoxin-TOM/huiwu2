import { prisma } from "@/lib/prisma";

export function listMeetingStaff(meetingId: string) {
  return prisma.meetingStaff.findMany({
    where: { meetingId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { grantedAt: "asc" },
  });
}

export async function authorizeUserForMeeting(meetingId: string, email: string) {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) throw new Error("USER_NOT_FOUND");

  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId }, select: { ownerId: true } });
  if (!meeting) throw new Error("MEETING_NOT_FOUND");
  if (meeting.ownerId === user.id) throw new Error("ALREADY_OWNER");

  const existing = await prisma.meetingStaff.findUnique({
    where: { meetingId_userId: { meetingId, userId: user.id } },
  });
  if (existing) throw new Error("ALREADY_AUTHORIZED");

  await prisma.$transaction(async (tx) => {
    await tx.meetingStaff.create({ data: { meetingId, userId: user.id } });
    if (user.role !== "ADMIN") {
      await tx.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
    }
  });

  return { userId: user.id, name: user.name, email: user.email };
}

export async function revokeMeetingStaff(meetingId: string, userId: string) {
  await prisma.meetingStaff.delete({ where: { meetingId_userId: { meetingId, userId } } }).catch(() => {});
}
