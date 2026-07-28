import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { Speaker } from "@prisma/client";

type SpeakerData = {
  name: string;
  title: string;
  organization: string;
  bio: string;
  photoUrl: string;
};

/** 由讲者自动生成的嘉宾记录的备注标记，认领时靠它找回对应记录 */
export const SPEAKER_GUEST_NOTE = "由讲者自动生成";

/**
 * 历史版本兜底分支写过别的备注，认领时必须一并匹配，
 * 否则老数据会被当成不存在而重复生成一条嘉宾。
 */
export const LEGACY_SPEAKER_GUEST_NOTES = ["由讲者接受邀约后生成"];

const SPEAKER_GUEST_NOTES = [SPEAKER_GUEST_NOTE, ...LEGACY_SPEAKER_GUEST_NOTES];

export function createSpeaker(meetingId: string, data: SpeakerData) {
  return prisma.speaker.create({ data: { ...data, meetingId } });
}

/**
 * 创建讲者并同步生成其嘉宾记录。
 *
 * 必须在同一事务里：两者分开写时，嘉宾写入失败会留下一个没有嘉宾记录的讲者，
 * 而接口又返回失败，管理员重试就变成重复讲者 + 嘉宾管理里查无此人。
 */
export function createSpeakerWithGuest(meetingId: string, data: SpeakerData) {
  return prisma.$transaction(async (tx) => {
    const speaker = await tx.speaker.create({ data: { ...data, meetingId } });
    await tx.guest.create({
      data: {
        meetingId,
        name: speaker.name,
        phone: null,
        email: null,
        company: speaker.organization,
        title: speaker.title,
        level: "NORMAL",
        bio: speaker.bio,
        note: SPEAKER_GUEST_NOTE,
        seatInfo: "",
      },
    });
    return speaker;
  });
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
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.speaker.update({
        where: { token },
        data: { confirmed: true, confirmedAt: new Date(), userId },
      });

      // 自动创建/更新报名记录，状态为已通过
      let regType = await tx.registrationType.findFirst({ where: { name: "讲者" } });
      if (!regType) {
        regType = await tx.registrationType.create({
          data: { name: "讲者", fee: 0, description: "讲者身份" },
        });
      }
      await tx.registration.upsert({
        where: { userId_meetingId: { userId, meetingId: speaker.meetingId } },
        create: {
          userId,
          meetingId: speaker.meetingId,
          typeId: regType.id,
          fullName: speaker.name,
          organization: speaker.organization,
          title: speaker.title,
          phone: "",
          status: "APPROVED",
          token: randomUUID().replace(/-/g, ""),
        },
        update: {
          typeId: regType.id,
          status: "APPROVED",
        },
      });

      // 自动确认由讲者生成的嘉宾记录
      const guest = await tx.guest.findFirst({
        where: {
          meetingId: speaker.meetingId,
          name: speaker.name,
          note: { in: SPEAKER_GUEST_NOTES },
        },
        orderBy: { createdAt: "desc" },
      });
      if (guest) {
        await tx.guest.update({
          where: { id: guest.id },
          data: { confirmed: true, confirmedAt: new Date() },
        });
      } else {
        await tx.guest.create({
          data: {
            meetingId: speaker.meetingId,
            name: speaker.name,
            phone: null,
            email: null,
            company: speaker.organization,
            title: speaker.title,
            level: "NORMAL",
            bio: speaker.bio,
            note: SPEAKER_GUEST_NOTE,
            seatInfo: "",
            confirmed: true,
            confirmedAt: new Date(),
          },
        });
      }

      return updated;
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
