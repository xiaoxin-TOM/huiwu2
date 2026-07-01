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

export function getAllSpeakers(): Promise<Speaker[]> {
  return prisma.speaker.findMany({ orderBy: { name: "asc" } });
}

export function getSpeakerById(id: string): Promise<Speaker | null> {
  return prisma.speaker.findUnique({ where: { id } });
}
