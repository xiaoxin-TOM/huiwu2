import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";
import type { ChannelInput } from "@/lib/validation";

export function listChannels(meetingId: string) {
  return prisma.channel.findMany({
    where: { meetingId },
    orderBy: { createdAt: "desc" },
  });
}

export function getChannelById(id: string) {
  return prisma.channel.findUnique({ where: { id } });
}

export async function getChannelIdFromCode(meetingId: string, code: string) {
  const ch = await prisma.channel.findUnique({
    where: { meetingId_code: { meetingId, code } },
  });
  return ch?.id ?? null;
}

export function createChannel(meetingId: string, input: ChannelInput) {
  return prisma.channel.create({
    data: {
      meetingId,
      code: input.code.trim(),
      name: input.name.trim(),
      owner: input.owner.trim(),
      note: input.note.trim(),
    },
  });
}

export function updateChannel(id: string, input: ChannelInput) {
  return prisma.channel.update({
    where: { id },
    data: {
      code: input.code.trim(),
      name: input.name.trim(),
      owner: input.owner.trim(),
      note: input.note.trim(),
    },
  });
}

export function deleteChannel(id: string) {
  return prisma.channel.delete({ where: { id } });
}

export function recordChannelVisit(channelId: string, meta?: { ip?: string; ua?: string; sessionId?: string }) {
  return prisma.channelVisit.create({
    data: {
      channelId,
      ip: meta?.ip,
      ua: meta?.ua,
      sessionId: meta?.sessionId,
    },
  });
}

export async function channelStats(meetingId: string) {
  const channels = await prisma.channel.findMany({
    where: { meetingId },
    include: { visits: { select: { id: true, sessionId: true } } },
  });
  const registrations = await prisma.registration.findMany({
    where: { meetingId, channelId: { not: null } },
  });
  return channels.map((ch) => {
    const pv = ch.visits.length;
    const uv = new Set(ch.visits.map((v) => v.sessionId).filter(Boolean)).size;
    const regs = registrations.filter((r) => r.channelId === ch.id);
    const checkins = regs.filter((r) => r.checkedIn).length;
    return {
      id: ch.id,
      code: ch.code,
      name: ch.name,
      owner: ch.owner,
      pv,
      uv,
      registrations: regs.length,
      checkins,
      conversion: pv > 0 ? ((regs.length / pv) * 100).toFixed(2) + "%" : "-",
    };
  });
}

export async function exportChannelStatsCsv(meetingId: string) {
  const stats = await channelStats(meetingId);
  return toCsv(
    ["渠道", "短码", "负责人", "PV", "UV", "报名", "签到", "转化率"],
    stats.map((s) => [s.name, s.code, s.owner, s.pv, s.uv, s.registrations, s.checkins, s.conversion]),
  );
}
