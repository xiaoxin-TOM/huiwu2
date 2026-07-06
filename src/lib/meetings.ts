import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export function listMeetings() {
  return prisma.meeting.findMany({
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });
}

export function getDefaultMeeting() {
  return prisma.meeting.findFirst({ where: { isDefault: true } });
}

export async function requireDefaultMeeting(): Promise<NonNullable<Awaited<ReturnType<typeof getDefaultMeeting>>>> {
  const meeting = await getDefaultMeeting();
  if (!meeting) throw new Error("NO_DEFAULT_MEETING");
  return meeting;
}

export function getMeetingById(id: string) {
  return prisma.meeting.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: {
        select: { registrations: true, bookings: true, submissions: true, guests: true, channels: true },
      },
    },
  });
}

export async function createMeeting(data: {
  title: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  requireApproval?: boolean;
  registrationLimit?: number | null;
  opensAt?: string | null;
  closesAt?: string | null;
  ownerId?: string;
}) {
  const count = await prisma.meeting.count();
  return prisma.meeting.create({
    data: {
      ...data,
      isDefault: count === 0,
    },
  });
}

export function updateMeeting(
  id: string,
  data: {
    title: string;
    description?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    requireApproval?: boolean;
    registrationLimit?: number | null;
    opensAt?: string | null;
    closesAt?: string | null;
  },
) {
  return prisma.meeting.update({ where: { id }, data });
}

export function updateMeetingConfig(
  id: string,
  data: {
    title?: string;
    confDate?: string;
    location?: string;
    logoUrl?: string | null;
    liveUrl?: string | null;
    welcomeHtml?: string;
    footerHtml?: string;
    contactHtml?: string;
  },
) {
  return prisma.meeting.update({ where: { id }, data });
}

export async function deleteMeeting(id: string) {
  return prisma.meeting.delete({ where: { id } });
}

export async function setDefaultMeeting(id: string) {
  await prisma.$transaction([
    prisma.meeting.updateMany({ data: { isDefault: false } }),
    prisma.meeting.update({ where: { id }, data: { isDefault: true } }),
  ]);
}

export async function getCurrentMeetingId(): Promise<string | null> {
  const c = await cookies();
  const id = c.get("admin_meeting_id")?.value;
  if (id) {
    const exists = await prisma.meeting.findUnique({ where: { id } });
    if (exists) return id;
  }
  const def = await getDefaultMeeting();
  return def?.id ?? null;
}

export async function getCurrentMeeting() {
  const id = await getCurrentMeetingId();
  if (!id) return null;
  return prisma.meeting.findUnique({ where: { id } });
}

export async function requireCurrentMeeting(): Promise<NonNullable<Awaited<ReturnType<typeof getCurrentMeeting>>>> {
  const meeting = await getCurrentMeeting();
  if (!meeting) throw new Error("NO_CURRENT_MEETING");
  return meeting;
}

export function getCurrentMeetingIdFromRequest(req: Request): string | undefined {
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(/admin_meeting_id=([^;]+)/);
  return match?.[1];
}

export async function requireCurrentMeetingForRequest(req: Request) {
  const id = getCurrentMeetingIdFromRequest(req);
  const meeting = id
    ? await prisma.meeting.findUnique({ where: { id } })
    : await getDefaultMeeting();
  if (!meeting) throw new Error("NO_CURRENT_MEETING");
  return meeting;
}

export async function resolveMeetingId(meetingId?: string | null): Promise<string> {
  if (meetingId) {
    const exists = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (exists) return exists.id;
  }
  const def = await getDefaultMeeting();
  if (!def) throw new Error("NO_DEFAULT_MEETING");
  return def.id;
}

export async function resolveMeeting(meetingId?: string | null) {
  if (meetingId) {
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (meeting) return meeting;
  }
  return requireDefaultMeeting();
}

export async function requireMeetingFromSearchParams(searchParams: { m?: string } | Promise<{ m?: string }>) {
  const params = await searchParams;
  return resolveMeeting(params.m);
}
