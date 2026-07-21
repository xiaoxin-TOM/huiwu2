import { prisma } from "@/lib/prisma";
import { getDefaultMeeting } from "@/lib/meetings";
import { getPublicConfig } from "@/lib/public";
import { listHomeGridItems, getHomeGridColumns, getHomeGridRounded } from "@/lib/home-grid";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import type { Meeting } from "@prisma/client";

export async function getPublicMeeting(): Promise<Meeting | null> {
  const c = await cookies();
  const id = c.get("public_meeting_id")?.value;
  if (id) {
    const exists = await prisma.meeting.findUnique({ where: { id } });
    if (exists) return exists;
  }
  return getDefaultMeeting();
}

export async function requirePublicMeeting(): Promise<Meeting> {
  const meeting = await getPublicMeeting();
  if (!meeting) throw new Error("NO_DEFAULT_MEETING");
  return meeting;
}

export async function getPublicMeetingConfig() {
  const meeting = await requirePublicMeeting();
  const [siteConfig, homeGridItems, homeGridColumns, homeGridRounded] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { id: 1 } }),
    listHomeGridItems(meeting.id),
    getHomeGridColumns(meeting.id),
    getHomeGridRounded(meeting.id),
  ]);
  const cfg = getPublicConfig(meeting, siteConfig);
  return { meeting, cfg, homeGridItems, homeGridColumns, homeGridRounded };
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export function jsonOk(data: unknown) {
  return Response.json({ ok: true, data });
}

export function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

export function getMeetingIdForPublic(): Promise<string> {
  return requirePublicMeeting().then((m) => m.id);
}
