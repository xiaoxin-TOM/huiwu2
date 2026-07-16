import { prisma } from "@/lib/prisma";

export interface LiveStreamInput {
  name: string;
  url: string;
  coverImage: string;
  description: string;
  time: string;
  isVisible: boolean;
}

export interface LiveStreamView extends LiveStreamInput {
  id: string;
}

function toView(item: { id: string; name: string; url: string; coverImage: string | null; description: string; time: string; isVisible: boolean }): LiveStreamView {
  return {
    id: item.id,
    name: item.name,
    url: item.url,
    coverImage: item.coverImage ?? "",
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

export async function replaceLiveStreams(meetingId: string, items: LiveStreamInput[]) {
  await prisma.$transaction(async (tx) => {
    await tx.liveStream.deleteMany({ where: { meetingId } });
    if (items.length > 0) {
      await tx.liveStream.createMany({
        data: items.map((item, sortOrder) => ({
          meetingId,
          name: item.name,
          url: item.url,
          coverImage: item.coverImage || null,
          description: item.description,
          time: item.time,
          sortOrder,
          isVisible: item.isVisible,
        })),
      });
    }
  });
}
