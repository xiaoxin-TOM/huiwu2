import { prisma } from "@/lib/prisma";

export interface LiveStreamInput {
  id?: string;
  name: string;
  url: string;
  coverImage: string;
  introImage: string;
  description: string;
  time: string;
  isVisible: boolean;
}

export interface LiveStreamView extends LiveStreamInput {
  id: string;
}

function toView(item: { id: string; name: string; url: string; coverImage: string | null; introImage: string | null; description: string; time: string; isVisible: boolean }): LiveStreamView {
  return {
    id: item.id,
    name: item.name,
    url: item.url,
    coverImage: item.coverImage ?? "",
    introImage: item.introImage ?? "",
    description: item.description,
    time: item.time,
    isVisible: item.isVisible,
  };
}

export async function listLiveStreams(meetingId: string): Promise<LiveStreamView[]> {
  const items = await prisma.liveStream.findMany({
    where: { meetingId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  return items.map(toView);
}

export async function listVisibleLiveStreams(meetingId: string): Promise<LiveStreamView[]> {
  const items = await prisma.liveStream.findMany({
    where: { meetingId, isVisible: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  return items.map(toView);
}

export async function getLiveStreamById(id: string, meetingId?: string) {
  const where: { id: string; meetingId?: string } = { id };
  if (meetingId) where.meetingId = meetingId;
  const item = await prisma.liveStream.findFirst({ where });
  return item ? toView(item) : null;
}

export async function replaceLiveStreams(meetingId: string, items: LiveStreamInput[], multiButton: boolean) {
  await prisma.$transaction(async (tx) => {
    await tx.meeting.update({
      where: { id: meetingId },
      data: { liveMultiButton: multiButton },
    });

    const existingIds = items
      .map((item) => item.id)
      .filter((id): id is string => !!id && !id.startsWith("draft-"));

    // 删除未出现在本次保存中的会场
    await tx.liveStream.deleteMany({
      where: { meetingId, id: { notIn: existingIds } },
    });

    // 更新/新建会场
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const baseData = {
        meetingId,
        name: item.name,
        url: item.url,
        coverImage: item.coverImage || null,
        introImage: item.introImage || null,
        description: item.description,
        time: item.time,
        sortOrder: i,
        isVisible: item.isVisible,
      };
      if (item.id && !item.id.startsWith("draft-")) {
        const existing = await tx.liveStream.findUnique({ where: { id: item.id } });
        if (existing) {
          await tx.liveStream.update({ where: { id: item.id }, data: baseData });
          continue;
        }
      }
      await tx.liveStream.create({ data: baseData });
    }
  });
}
