import { prisma } from "@/lib/prisma";
import {
  DEFAULT_HOME_GRID_ITEMS,
  type HomeGridIconKey,
  type HomeGridItemInput,
  type HomeGridSize,
} from "@/lib/home-grid-config";

export interface HomeGridItemView extends HomeGridItemInput {
  id: string;
}

function defaultItems(): HomeGridItemView[] {
  return DEFAULT_HOME_GRID_ITEMS.map((item, index) => ({
    ...item,
    id: `default-${index}`,
  }));
}

export async function listHomeGridItems(meetingId: string): Promise<HomeGridItemView[]> {
  const items = await prisma.homeGridItem.findMany({
    where: { meetingId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  if (items.length === 0) return defaultItems();
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    href: item.href,
    icon: item.icon as HomeGridIconKey,
    size: item.size as HomeGridSize,
    backgroundImage: item.backgroundImage ?? "",
    isVisible: item.isVisible,
  }));
}

export async function replaceHomeGridItems(meetingId: string, items: HomeGridItemInput[]) {
  await prisma.$transaction(async (tx) => {
    await tx.homeGridItem.deleteMany({ where: { meetingId } });
    await tx.homeGridItem.createMany({
      data: items.map((item, sortOrder) => ({
        meetingId,
        title: item.title,
        href: item.href,
        icon: item.icon,
        size: item.size,
        backgroundImage: item.backgroundImage || null,
        sortOrder,
        isVisible: item.isVisible,
      })),
    });
  });
}

export function defaultHomeGridCreateData() {
  return DEFAULT_HOME_GRID_ITEMS.map((item, sortOrder) => ({
    ...item,
    backgroundImage: item.backgroundImage || null,
    sortOrder,
  }));
}
