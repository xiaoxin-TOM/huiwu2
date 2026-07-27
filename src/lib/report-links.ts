import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

export function listReportLinks(meetingId: string) {
  return prisma.reportLink.findMany({
    where: { meetingId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createReportLink(params: {
  meetingId: string;
  name: string;
  password: string;
  expiresAt: Date | null;
  createdById: string;
}) {
  return prisma.reportLink.create({
    data: {
      meetingId: params.meetingId,
      name: params.name,
      passwordHash: await hashPassword(params.password),
      expiresAt: params.expiresAt,
      createdById: params.createdById,
    },
  });
}

export function getReportLinkByToken(token: string) {
  return prisma.reportLink.findUnique({ where: { token }, include: { meeting: true } });
}

export function getReportLinkById(id: string) {
  return prisma.reportLink.findUnique({ where: { id } });
}

export function setReportLinkActive(id: string, isActive: boolean) {
  return prisma.reportLink.update({ where: { id }, data: { isActive } });
}

export function deleteReportLink(id: string) {
  return prisma.reportLink.delete({ where: { id } });
}

export type ReportLinkState = "OK" | "INACTIVE" | "EXPIRED";

/** 链接本身是否还能用（与密码无关） */
export function reportLinkState(
  link: { isActive: boolean; expiresAt: Date | null },
  now: Date = new Date(),
): ReportLinkState {
  if (!link.isActive) return "INACTIVE";
  if (link.expiresAt && link.expiresAt.getTime() <= now.getTime()) return "EXPIRED";
  return "OK";
}

export function checkReportLinkPassword(link: { passwordHash: string }, password: string) {
  return verifyPassword(password, link.passwordHash);
}
