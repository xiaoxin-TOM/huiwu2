import { prisma } from "@/lib/prisma";

export function createSubmission(
  userId: string,
  data: { title: string; authors: string; abstract: string; fileUrl: string | null },
) {
  return prisma.submission.create({ data: { userId, ...data } });
}

export function listUserSubmissions(userId: string) {
  return prisma.submission.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export function listSubmissions() {
  return prisma.submission.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
}

export function reviewSubmission(id: string, decision: "APPROVED" | "REJECTED") {
  return prisma.submission.update({ where: { id }, data: { status: decision } });
}
