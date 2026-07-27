import { prisma } from "@/lib/prisma";
import type { MaterialFacts, MaterialStatus } from "@/lib/material-access";

export type SpeakerMaterialInput = {
  speakerId: string;
  sessionId: string;
  fileKey: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isConfidential: boolean;
};

export function createSpeakerMaterial(data: SpeakerMaterialInput) {
  return prisma.speakerMaterial.create({ data });
}

/** 讲者本人的资料列表（任何状态） */
export function listSpeakerMaterials(speakerId: string) {
  return prisma.speakerMaterial.findMany({
    where: { speakerId },
    include: { session: true },
    orderBy: { uploadedAt: "desc" },
  });
}

const withContext = {
  speaker: { select: { id: true, name: true, userId: true, meetingId: true } },
  session: { select: { id: true, day: true, startTime: true, endTime: true, room: true, title: true } },
} as const;

export function getMaterialWithContext(id: string) {
  return prisma.speakerMaterial.findUnique({ where: { id }, include: withContext });
}

export type MaterialWithContext = NonNullable<Awaited<ReturnType<typeof getMaterialWithContext>>>;

/** 把一条材料收敛成访问判定所需的最小事实集 */
export function toMaterialFacts(material: MaterialWithContext): MaterialFacts {
  return {
    meetingId: material.speaker.meetingId,
    status: material.status as MaterialStatus,
    isConfidential: material.isConfidential,
    speakerUserId: material.speaker.userId,
  };
}

/** 管理员审核列表：该会议下全部材料 */
export function listMeetingMaterials(meetingId: string) {
  return prisma.speakerMaterial.findMany({
    where: { speaker: { meetingId } },
    include: withContext,
    orderBy: [{ status: "asc" }, { uploadedAt: "desc" }],
  });
}

export function countPendingMaterials(meetingId: string) {
  return prisma.speakerMaterial.count({ where: { speaker: { meetingId }, status: "PENDING" } });
}

export function reviewMaterial(
  id: string,
  decision: "APPROVED" | "REJECTED",
  reviewedById: string,
  reviewNote = "",
) {
  return prisma.speakerMaterial.update({
    where: { id },
    data: { status: decision, reviewedById, reviewNote, reviewedAt: new Date() },
  });
}

export function deleteMaterial(id: string) {
  return prisma.speakerMaterial.delete({ where: { id } });
}

/**
 * 参会文件页：只取审核通过的公开材料。
 * 汇报链接的章程页传 includeConfidential=true，额外带上保密材料。
 */
export function listApprovedMaterials(meetingId: string, includeConfidential = false) {
  return prisma.speakerMaterial.findMany({
    where: {
      speaker: { meetingId },
      status: "APPROVED",
      ...(includeConfidential ? {} : { isConfidential: false }),
    },
    include: withContext,
    orderBy: [{ uploadedAt: "asc" }],
  });
}

export type MaterialListItem = Awaited<ReturnType<typeof listApprovedMaterials>>[number];

export type SessionMaterialGroup = {
  sessionId: string;
  day: string;
  room: string;
  startTime: string;
  endTime: string;
  title: string;
  speakers: string[];
  materials: MaterialListItem[];
};

export type DayMaterialGroup = {
  day: string;
  rooms: { room: string; sessions: SessionMaterialGroup[] }[];
};

/** 按 日期 → 会场 → 日程 分组，与会议日程页同构 */
export function groupMaterialsBySchedule(materials: MaterialListItem[]): DayMaterialGroup[] {
  const bySession = new Map<string, SessionMaterialGroup>();
  for (const m of materials) {
    let group = bySession.get(m.sessionId);
    if (!group) {
      group = {
        sessionId: m.sessionId,
        day: m.session.day,
        room: m.session.room,
        startTime: m.session.startTime,
        endTime: m.session.endTime,
        title: m.session.title,
        speakers: [],
        materials: [],
      };
      bySession.set(m.sessionId, group);
    }
    if (!group.speakers.includes(m.speaker.name)) group.speakers.push(m.speaker.name);
    group.materials.push(m);
  }

  const days: DayMaterialGroup[] = [];
  const sorted = [...bySession.values()].sort(
    (a, b) =>
      a.day.localeCompare(b.day) || a.room.localeCompare(b.room) || a.startTime.localeCompare(b.startTime),
  );
  for (const session of sorted) {
    let day = days.find((d) => d.day === session.day);
    if (!day) {
      day = { day: session.day, rooms: [] };
      days.push(day);
    }
    let room = day.rooms.find((r) => r.room === session.room);
    if (!room) {
      room = { room: session.room, sessions: [] };
      day.rooms.push(room);
    }
    room.sessions.push(session);
  }
  return days;
}
