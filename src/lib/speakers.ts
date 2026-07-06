import { prisma } from "@/lib/prisma";
import type { Speaker } from "@prisma/client";

export function filterSpeakers(speakers: Speaker[], query: string): Speaker[] {
  const q = query.trim().toLowerCase();
  if (!q) return speakers;
  return speakers.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.organization.toLowerCase().includes(q),
  );
}

export function getAllSpeakers(meetingId: string): Promise<Speaker[]> {
  return prisma.speaker.findMany({ where: { meetingId }, orderBy: { name: "asc" } });
}

export function getSpeakerById(id: string, meetingId?: string): Promise<Speaker | null> {
  const where: { id: string; meetingId?: string } = { id };
  if (meetingId) where.meetingId = meetingId;
  return prisma.speaker.findFirst({ where });
}
