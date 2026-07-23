import { cookies, headers } from "next/headers";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { defaultHomeGridCreateData } from "@/lib/home-grid";

async function currentAdminUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * 会议隔离:每个管理员只能访问自己创建的会议、其他管理员通过 MeetingStaff 授权的会议，
 * 以及历史上未设置 ownerId 的遗留会议(视为公共可见，避免升级后被锁在门外)。
 */
export async function canAccessMeeting(userId: string, meetingId: string): Promise<boolean> {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId }, select: { ownerId: true } });
  if (!meeting) return false;
  if (meeting.ownerId === null || meeting.ownerId === userId) return true;
  const staff = await prisma.meetingStaff.findUnique({
    where: { meetingId_userId: { meetingId, userId } },
  });
  return !!staff;
}

function accessibleMeetingWhere(userId: string): Prisma.MeetingWhereInput {
  return { OR: [{ ownerId: userId }, { ownerId: null }, { staff: { some: { userId } } }] };
}

async function firstAccessibleMeetingId(userId: string): Promise<string | null> {
  const where = accessibleMeetingWhere(userId);
  const preferred = await prisma.meeting.findFirst({ where: { ...where, isDefault: true } });
  if (preferred) return preferred.id;
  const fallback = await prisma.meeting.findFirst({ where, orderBy: { createdAt: "desc" } });
  return fallback?.id ?? null;
}

export function listMeetingsForUser(userId: string) {
  return prisma.meeting.findMany({
    where: accessibleMeetingWhere(userId),
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
  requirePassword?: boolean;
  registrationPassword?: string;
  requireRealName?: boolean;
  ownerId?: string;
}) {
  const count = await prisma.meeting.count();
  return prisma.meeting.create({
    data: {
      ...data,
      isDefault: count === 0,
      homeGridItems: { create: defaultHomeGridCreateData() },
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
    requirePassword?: boolean;
    registrationPassword?: string;
    requireRealName?: boolean;
  },
) {
  return prisma.meeting.update({ where: { id }, data });
}

export function updateScheduleImageMode(
  id: string,
  data: { scheduleMode: "TEXT" | "IMAGE"; scheduleImageUrl: string },
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
    heroImageUrl?: string | null;
    liveUrl?: string | null;
    welcomeHtml?: string;
    footerHtml?: string;
    contactHtml?: string;
    venueAddress?: string;
    venueLng?: string;
    venueLat?: string;
    requirePassword?: boolean;
    registrationPassword?: string;
    requireRealName?: boolean;
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
  const userId = await currentAdminUserId();
  if (!userId) return null;
  const c = await cookies();
  const cookieId = c.get("admin_meeting_id")?.value;
  if (cookieId && (await canAccessMeeting(userId, cookieId))) return cookieId;
  return firstAccessibleMeetingId(userId);
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
  const userId = await currentAdminUserId();
  if (!userId) throw new Error("NO_CURRENT_MEETING");
  const cookieId = getCurrentMeetingIdFromRequest(req);
  const id =
    cookieId && (await canAccessMeeting(userId, cookieId)) ? cookieId : await firstAccessibleMeetingId(userId);
  const meeting = id ? await prisma.meeting.findUnique({ where: { id } }) : null;
  if (!meeting) throw new Error("NO_CURRENT_MEETING");
  return meeting;
}

export async function getPublicMeetingFromCookie() {
  const c = await cookies();
  const id = c.get("public_meeting_id")?.value;
  if (!id) return null;
  return prisma.meeting.findUnique({ where: { id } });
}

export async function getPublicMeetingForRequest() {
  const h = await headers();
  const headerId = h.get("x-meeting-id");
  if (headerId) {
    const meeting = await prisma.meeting.findUnique({ where: { id: headerId } });
    if (meeting) return meeting;
  }
  const cookieMeeting = await getPublicMeetingFromCookie();
  if (cookieMeeting) return cookieMeeting;
  return getDefaultMeeting();
}

export async function resolveMeetingId(meetingId?: string | null): Promise<string> {
  if (meetingId) {
    const exists = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (exists) return exists.id;
  }
  const cookieMeeting = await getPublicMeetingFromCookie();
  if (cookieMeeting) return cookieMeeting.id;
  const def = await getDefaultMeeting();
  if (!def) throw new Error("NO_DEFAULT_MEETING");
  return def.id;
}

export async function resolveMeeting(meetingId?: string | null) {
  if (meetingId) {
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (meeting) return meeting;
  }
  const cookieMeeting = await getPublicMeetingFromCookie();
  if (cookieMeeting) return cookieMeeting;
  return requireDefaultMeeting();
}

export async function requireMeetingFromSearchParams(searchParams: { m?: string } | Promise<{ m?: string }>) {
  const params = await searchParams;
  return resolveMeeting(params.m);
}

export async function getSelectedMeetingId(): Promise<string | null> {
  const userId = await currentAdminUserId();
  if (!userId) return null;
  const c = await cookies();
  const id = c.get("admin_meeting_id")?.value;
  if (!id) return null;
  return (await canAccessMeeting(userId, id)) ? id : null;
}

export async function getSelectedMeeting() {
  const id = await getSelectedMeetingId();
  if (!id) return null;
  return prisma.meeting.findUnique({ where: { id } });
}

export async function requireSelectedMeeting(): Promise<NonNullable<Awaited<ReturnType<typeof getSelectedMeeting>>>> {
  const meeting = await getSelectedMeeting();
  if (!meeting) throw new Error("NO_SELECTED_MEETING");
  return meeting;
}
