import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { Speaker } from "@prisma/client";

type SpeakerData = {
  name: string;
  title: string;
  organization: string;
  bio: string;
  photoUrl: string;
  isModerator: boolean;
};

export function createSpeaker(meetingId: string, data: SpeakerData) {
  return prisma.speaker.create({ data: { ...data, meetingId } });
}

export function updateSpeaker(id: string, data: SpeakerData) {
  return prisma.speaker.update({ where: { id }, data });
}

export function deleteSpeaker(id: string) {
  return prisma.speaker.delete({ where: { id } });
}

export async function ensureSpeakerToken(id: string): Promise<Speaker> {
  const speaker = await prisma.speaker.findUnique({ where: { id } });
  if (!speaker) throw new Error("讲者不存在");
  if (speaker.invitedAt) return speaker;
  return prisma.speaker.update({
    where: { id },
    data: { token: speaker.token ?? randomUUID(), invitedAt: new Date() },
  });
}

export function getSpeakerByToken(token: string) {
  return prisma.speaker.findUnique({
    where: { token },
    include: { meeting: true, user: true },
  });
}

export async function acceptSpeakerInvitation(token: string, userId: string): Promise<Speaker> {
  const speaker = await prisma.speaker.findUnique({ where: { token } });
  if (!speaker) throw new Error("邀约链接无效");
  if (speaker.confirmed) {
    if (speaker.userId === userId) return speaker;
    throw new Error("该邀约已被其他账号接受");
  }
  try {
    return await prisma.speaker.update({
      where: { token },
      data: { confirmed: true, confirmedAt: new Date(), userId },
    });
  } catch (error) {
    console.error("[acceptSpeakerInvitation] update failed:", error);
    const detail = error instanceof Error ? `: ${error.message}` : "";
    throw new Error(`接受邀约失败${detail}`);
  }
}

export function getSpeakerByUserId(userId: string, meetingId: string) {
  return prisma.speaker.findFirst({
    where: { userId, meetingId, confirmed: true },
    include: { sessions: { include: { session: true } } },
  });
}

export function listSpeakersByUserId(userId: string) {
  return prisma.speaker.findMany({
    where: { userId, confirmed: true },
    include: { meeting: true },
    orderBy: { confirmedAt: "desc" },
  });
}
