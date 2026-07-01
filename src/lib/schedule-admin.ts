import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionWithSpeakers } from "@/lib/schedule";

type SessionData = {
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  title: string;
  isBrief: boolean;
};

const include = { speakers: { include: { speaker: true } } } as const;

export function listSessionsAdmin(): Promise<SessionWithSpeakers[]> {
  return prisma.session.findMany({
    include,
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  });
}

export function getSessionAdmin(id: string): Promise<SessionWithSpeakers | null> {
  return prisma.session.findUnique({ where: { id }, include });
}

export function createSession(data: SessionData) {
  return prisma.session.create({ data });
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
