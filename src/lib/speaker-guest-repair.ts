import { prisma } from "@/lib/prisma";
import { SPEAKER_GUEST_NOTE, LEGACY_SPEAKER_GUEST_NOTES } from "@/lib/speakers-admin";

const SPEAKER_GUEST_NOTES = [SPEAKER_GUEST_NOTE, ...LEGACY_SPEAKER_GUEST_NOTES];

/**
 * 找出在嘉宾管理里查无记录的讲者。
 *
 * 成因是历史上讲者与嘉宾分两步写入且不在事务里：嘉宾那步失败就会留下孤儿讲者。
 * 判定按「同会议同名」而非备注——管理员手工建过同名嘉宾的也算已有记录，
 * 补一条同名的只会让接待名单出现重复行。
 */
export function findSpeakersMissingGuest(meetingId?: string) {
  return prisma.speaker.findMany({
    where: {
      ...(meetingId ? { meetingId } : {}),
      NOT: { name: { in: [] } },
    },
    select: {
      id: true,
      name: true,
      meetingId: true,
      organization: true,
      title: true,
      bio: true,
      confirmed: true,
      confirmedAt: true,
    },
    orderBy: { name: "asc" },
  }).then(async (speakers) => {
    const results: typeof speakers = [];
    for (const s of speakers) {
      const existing = await prisma.guest.findFirst({
        where: { meetingId: s.meetingId, name: s.name },
        select: { id: true },
      });
      if (!existing) results.push(s);
    }
    return results;
  });
}

export type SpeakerGuestRepairResult = {
  created: number;
  speakers: { name: string; meetingId: string }[];
};

/** 为缺失嘉宾记录的讲者补建记录。幂等，可重复执行。 */
export async function repairSpeakerGuests(meetingId?: string): Promise<SpeakerGuestRepairResult> {
  const missing = await findSpeakersMissingGuest(meetingId);
  for (const s of missing) {
    await prisma.guest.create({
      data: {
        meetingId: s.meetingId,
        name: s.name,
        phone: null,
        email: null,
        company: s.organization,
        title: s.title,
        level: "NORMAL",
        bio: s.bio,
        note: SPEAKER_GUEST_NOTE,
        seatInfo: "",
        // 讲者已认证的，补出来的嘉宾记录同步标记为已确认
        confirmed: s.confirmed,
        confirmedAt: s.confirmedAt,
      },
    });
  }
  return {
    created: missing.length,
    speakers: missing.map((s) => ({ name: s.name, meetingId: s.meetingId })),
  };
}

/** 统计口径不一致的历史备注，供排查用 */
export function countLegacyNoteGuests() {
  return prisma.guest.count({ where: { note: { in: LEGACY_SPEAKER_GUEST_NOTES } } });
}

export { SPEAKER_GUEST_NOTES };
