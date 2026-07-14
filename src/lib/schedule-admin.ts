import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionWithSpeakers } from "@/lib/schedule";

type SessionData = {
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  title: string;
};

const include = { speakers: { include: { speaker: true } } } as const;

export function listSessionsAdmin(meetingId: string): Promise<SessionWithSpeakers[]> {
  return prisma.session.findMany({
    where: { meetingId },
    include,
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  });
}

export function getSessionAdmin(id: string, meetingId?: string): Promise<SessionWithSpeakers | null> {
  const where: { id: string; meetingId?: string } = { id };
  if (meetingId) where.meetingId = meetingId;
  return prisma.session.findFirst({ where, include });
}

export function createSession(meetingId: string, data: SessionData) {
  return prisma.session.create({ data: { ...data, meetingId } });
}

export async function createSessionWithSpeakers(
  meetingId: string,
  data: SessionData,
  links: { speakerId: string; role: string }[],
) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.session.create({ data: { ...data, meetingId } });
    if (links.length > 0) {
      const seen = new Set<string>();
      const uniqueLinks = links.filter((l) => {
        const key = `${l.speakerId}-${l.role}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      await tx.sessionSpeaker.createMany({
        data: uniqueLinks.map((l) => ({
          sessionId: session.id,
          speakerId: l.speakerId,
          role: l.role,
        })),
      });
    }
    return session;
  });
}

export function updateSession(id: string, data: SessionData) {
  return prisma.session.update({ where: { id }, data });
}

export function deleteSession(id: string) {
  return prisma.session.delete({ where: { id } });
}

export async function addSessionSpeaker(sessionId: string, speakerId: string, role: string) {
  try {
    return await prisma.sessionSpeaker.create({ data: { sessionId, speakerId, role } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error("DUPLICATE_LINK");
    }
    throw e;
  }
}

export function removeSessionSpeaker(sessionId: string, speakerId: string, role: string) {
  return prisma.sessionSpeaker.delete({
    where: { sessionId_speakerId_role: { sessionId, speakerId, role } },
  });
}
