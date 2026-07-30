import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { replaceHomeGridItems } from "@/lib/home-grid";
import {
  BUILTIN_MEETING_TEMPLATES,
  getBuiltinTemplate,
  normalizeTemplateItems,
  type MeetingTemplateShape,
} from "@/lib/meeting-templates";
import type { HomeGridColumns } from "@/lib/home-grid-config";

export type TemplateChoice = MeetingTemplateShape & { source: "BUILTIN" | "CUSTOM"; id?: string };

function clampColumns(n: number): HomeGridColumns {
  return n === 2 || n === 3 ? n : 4;
}

/** 内置六套 + 该管理员可见的自定义模板 */
export async function listTemplateChoices(ownerId: string): Promise<TemplateChoice[]> {
  const custom = await prisma.meetingTemplate.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
  });
  return [
    ...BUILTIN_MEETING_TEMPLATES.map((t) => ({ ...t, source: "BUILTIN" as const })),
    ...custom.map((t) => ({
      key: `custom:${t.id}`,
      id: t.id,
      source: "CUSTOM" as const,
      name: t.name,
      description: t.description,
      bgColor: t.bgColor,
      bgImageUrl: t.bgImageUrl,
      bgOverlay: t.bgOverlay,
      gridColumns: clampColumns(t.gridColumns),
      gridRounded: t.gridRounded,
      items: normalizeTemplateItems(t.items),
    })),
  ];
}

/** 解析模板 key：内置直接查常量，custom:<id> 查库并校验归属 */
export async function resolveTemplate(
  key: string,
  ownerId: string,
): Promise<MeetingTemplateShape | null> {
  if (key.startsWith("custom:")) {
    const id = key.slice("custom:".length);
    const row = await prisma.meetingTemplate.findUnique({ where: { id } });
    // 只能套用自己另存的模板，不能凭 id 猜别人的
    if (!row || row.ownerId !== ownerId) return null;
    return {
      key,
      name: row.name,
      description: row.description,
      bgColor: row.bgColor,
      bgImageUrl: row.bgImageUrl,
      bgOverlay: row.bgOverlay,
      gridColumns: clampColumns(row.gridColumns),
      gridRounded: row.gridRounded,
      items: normalizeTemplateItems(row.items),
    };
  }
  return getBuiltinTemplate(key);
}

/**
 * 把模板套用到会议：替换宫格入口，并写入外观。
 * 只动宫格与外观字段，不触碰报名、日程、内容页等业务数据。
 */
export async function applyTemplateToMeeting(meetingId: string, template: MeetingTemplateShape) {
  const items = normalizeTemplateItems(template.items);
  if (items.length === 0) throw new Error("TEMPLATE_EMPTY");

  await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      homeGridColumns: template.gridColumns,
      homeGridRounded: template.gridRounded,
      bgColor: template.bgColor,
      bgImageUrl: template.bgImageUrl,
      bgOverlay: template.bgOverlay,
    },
  });
  await replaceHomeGridItems(meetingId, items);
  return items.length;
}

/** 把当前会议的宫格与外观另存为模板 */
export async function saveMeetingAsTemplate(params: {
  meetingId: string;
  ownerId: string;
  name: string;
  description: string;
}) {
  const meeting = await prisma.meeting.findUnique({
    where: { id: params.meetingId },
    select: {
      homeGridColumns: true,
      homeGridRounded: true,
      bgColor: true,
      bgImageUrl: true,
      bgOverlay: true,
      homeGridItems: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
    },
  });
  if (!meeting) throw new Error("MEETING_NOT_FOUND");

  const items = meeting.homeGridItems.map((i) => ({
    title: i.title,
    href: i.href,
    icon: i.icon,
    size: i.size,
    backgroundImage: i.backgroundImage ?? "",
    isVisible: i.isVisible,
  }));
  const normalized = normalizeTemplateItems(items);
  if (normalized.length === 0) throw new Error("NO_ITEMS");

  return prisma.meetingTemplate.create({
    data: {
      name: params.name,
      description: params.description,
      ownerId: params.ownerId,
      bgColor: meeting.bgColor,
      bgImageUrl: meeting.bgImageUrl,
      bgOverlay: meeting.bgOverlay,
      gridColumns: meeting.homeGridColumns,
      gridRounded: meeting.homeGridRounded,
      items: normalized as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function deleteOwnTemplate(id: string, ownerId: string): Promise<boolean> {
  const row = await prisma.meetingTemplate.findUnique({ where: { id } });
  if (!row || row.ownerId !== ownerId) return false;
  await prisma.meetingTemplate.delete({ where: { id } });
  return true;
}

export function getMeetingAppearance(meetingId: string) {
  return prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { bgColor: true, bgImageUrl: true, bgOverlay: true },
  });
}
