import { prisma } from "@/lib/prisma";
import type { GuestInput, ReceptionInput } from "@/lib/validation";

export type GuestFilters = {
  level?: "ALL" | "VIP" | "NORMAL" | "MEDIA";
  q?: string;
};

export function listGuests(meetingId: string, filters: GuestFilters = {}) {
  const where: { meetingId: string; level?: string; name?: { contains: string; mode: "insensitive" } } = { meetingId };
  if (filters.level && filters.level !== "ALL") {
    where.level = filters.level;
  }
  if (filters.q?.trim()) {
    where.name = { contains: filters.q.trim(), mode: "insensitive" };
  }
  return prisma.guest.findMany({
    where,
    include: { reception: true },
    orderBy: [{ level: "asc" }, { createdAt: "desc" }],
  });
}

export function getGuestById(id: string) {
  return prisma.guest.findUnique({
    where: { id },
    include: { reception: true },
  });
}

export function getGuestByToken(token: string) {
  return prisma.guest.findUnique({
    where: { token },
    include: { meeting: true, reception: true },
  });
}

export function createGuest(meetingId: string, input: GuestInput) {
  return prisma.guest.create({
    data: {
      meetingId,
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      company: input.company.trim(),
      title: input.title.trim(),
      level: input.level,
      bio: input.bio.trim(),
      note: input.note.trim(),
      seatInfo: input.seatInfo.trim(),
    },
  });
}

export function updateGuest(id: string, input: GuestInput) {
  return prisma.guest.update({
    where: { id },
    data: {
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      company: input.company.trim(),
      title: input.title.trim(),
      level: input.level,
      bio: input.bio.trim(),
      note: input.note.trim(),
      seatInfo: input.seatInfo.trim(),
    },
  });
}

export function deleteGuest(id: string) {
  return prisma.guest.delete({ where: { id } });
}

export function confirmGuest(token: string) {
  return prisma.guest.update({
    where: { token },
    data: { confirmed: true, confirmedAt: new Date() },
  });
}

export function upsertReception(guestId: string, input: ReceptionInput) {
  return prisma.guestReception.upsert({
    where: { guestId },
    create: {
      guestId,
      ...input,
    },
    update: {
      ...input,
    },
  });
}

export function getReceptionById(id: string) {
  return prisma.guestReception.findUnique({ where: { id }, include: { guest: true } });
}

export function updateReception(id: string, input: ReceptionInput) {
  return prisma.guestReception.update({
    where: { id },
    data: { ...input },
  });
}

export function parseGuestCsv(text: string): GuestInput[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  const idx: Record<string, number> = {};
  headers.forEach((h, i) => {
    idx[h] = i;
  });
  const get = (row: string[], name: string) => {
    const i = idx[name];
    if (i === undefined) return "";
    return row[i]?.trim() ?? "";
  };
  const parseLevel = (v: string): "VIP" | "NORMAL" | "MEDIA" => {
    const s = v.trim().toLowerCase();
    if (["vip", "贵宾"].includes(s)) return "VIP";
    if (["嘉宾", "普通", "normal"].includes(s)) return "NORMAL";
    if (["媒体", "media"].includes(s)) return "MEDIA";
    return "NORMAL";
  };
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",");
    rows.push(row);
  }
  return rows.map((row) => ({
    name: get(row, "姓名"),
    phone: get(row, "手机"),
    email: get(row, "邮箱"),
    company: get(row, "单位"),
    title: get(row, "职位"),
    level: parseLevel(get(row, "级别")),
    bio: get(row, "简介"),
    note: get(row, "备注"),
    seatInfo: "",
  }));
}
