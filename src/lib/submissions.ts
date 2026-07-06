import { prisma } from "@/lib/prisma";
import type { SubmissionInput } from "@/lib/validation";

export function createSubmission(
  userId: string,
  meetingId: string,
  data: SubmissionInput & { fileUrl: string | null },
) {
  return prisma.submission.create({ data: { userId, meetingId, ...data } });
}

export function listUserSubmissions(userId: string, meetingId: string) {
  return prisma.submission.findMany({
    where: { userId, meetingId },
    orderBy: { createdAt: "desc" },
  });
}

export function listSubmissions(meetingId: string) {
  return prisma.submission.findMany({
    where: { meetingId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
}

export function reviewSubmission(id: string, decision: "APPROVED" | "REJECTED") {
  return prisma.submission.update({ where: { id }, data: { status: decision } });
}
