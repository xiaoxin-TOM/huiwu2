import { prisma } from "@/lib/prisma";
import { notifyAdminsOfSubmission, notifyUserOfReview } from "@/lib/notifications";

/**
 * 各业务实体到通知的适配层。
 *
 * 每个函数自行查上下文、自行吞异常，调用方只需在业务成功之后加一行 await，
 * 不必 try/catch，也不会因为通知出错而影响已完成的操作。
 */

export async function notifyRegistrationSubmitted(registrationId: string): Promise<void> {
  try {
    const reg = await prisma.registration.findUnique({
      where: { id: registrationId },
      select: { meetingId: true, fullName: true, status: true, type: { select: { name: true } } },
    });
    // 免审会议直接通过，没有待办，不打扰管理员
    if (!reg || reg.status !== "PENDING") return;
    await notifyAdminsOfSubmission("REGISTRATION_SUBMITTED", {
      meetingId: reg.meetingId,
      actorName: reg.fullName,
      subjectTitle: reg.type?.name,
    });
  } catch (error) {
    console.error("[notify hook] registration submitted", registrationId, error);
  }
}

export async function notifyRegistrationReviewed(
  registrationId: string,
  decision: "APPROVED" | "REJECTED",
): Promise<void> {
  try {
    const reg = await prisma.registration.findUnique({
      where: { id: registrationId },
      select: { meetingId: true, userId: true, type: { select: { name: true } } },
    });
    if (!reg) return;
    await notifyUserOfReview("REGISTRATION_REVIEWED", {
      meetingId: reg.meetingId,
      userId: reg.userId,
      decision,
      subjectTitle: reg.type?.name,
    });
  } catch (error) {
    console.error("[notify hook] registration reviewed", registrationId, error);
  }
}

export async function notifySubmissionSubmitted(submissionId: string): Promise<void> {
  try {
    const sub = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { meetingId: true, title: true, user: { select: { name: true } } },
    });
    if (!sub) return;
    await notifyAdminsOfSubmission("SUBMISSION_SUBMITTED", {
      meetingId: sub.meetingId,
      actorName: sub.user?.name,
      subjectTitle: sub.title,
    });
  } catch (error) {
    console.error("[notify hook] submission submitted", submissionId, error);
  }
}

export async function notifySubmissionReviewed(
  submissionId: string,
  decision: "APPROVED" | "REJECTED",
): Promise<void> {
  try {
    const sub = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { meetingId: true, userId: true, title: true },
    });
    if (!sub) return;
    await notifyUserOfReview("SUBMISSION_REVIEWED", {
      meetingId: sub.meetingId,
      userId: sub.userId,
      decision,
      subjectTitle: sub.title,
    });
  } catch (error) {
    console.error("[notify hook] submission reviewed", submissionId, error);
  }
}

export async function notifyBookingSubmitted(bookingId: string): Promise<void> {
  try {
    const booking = await prisma.hotelBooking.findUnique({
      where: { id: bookingId },
      select: { meetingId: true, user: { select: { name: true } }, hotel: { select: { name: true } } },
    });
    if (!booking) return;
    await notifyAdminsOfSubmission("BOOKING_SUBMITTED", {
      meetingId: booking.meetingId,
      actorName: booking.user?.name,
      subjectTitle: booking.hotel?.name,
    });
  } catch (error) {
    console.error("[notify hook] booking submitted", bookingId, error);
  }
}

export async function notifyBookingReviewed(
  bookingId: string,
  decision: "APPROVED" | "REJECTED",
): Promise<void> {
  try {
    const booking = await prisma.hotelBooking.findUnique({
      where: { id: bookingId },
      select: { meetingId: true, userId: true, hotel: { select: { name: true } } },
    });
    if (!booking) return;
    await notifyUserOfReview("BOOKING_REVIEWED", {
      meetingId: booking.meetingId,
      userId: booking.userId,
      decision,
      subjectTitle: booking.hotel?.name,
    });
  } catch (error) {
    console.error("[notify hook] booking reviewed", bookingId, error);
  }
}

export async function notifyMaterialSubmitted(materialId: string): Promise<void> {
  try {
    const material = await prisma.speakerMaterial.findUnique({
      where: { id: materialId },
      select: { fileName: true, speaker: { select: { name: true, meetingId: true } } },
    });
    if (!material) return;
    await notifyAdminsOfSubmission("MATERIAL_SUBMITTED", {
      meetingId: material.speaker.meetingId,
      actorName: material.speaker.name,
      subjectTitle: material.fileName,
    });
  } catch (error) {
    console.error("[notify hook] material submitted", materialId, error);
  }
}

export async function notifyMaterialReviewed(
  materialId: string,
  decision: "APPROVED" | "REJECTED",
  reviewNote: string,
): Promise<void> {
  try {
    const material = await prisma.speakerMaterial.findUnique({
      where: { id: materialId },
      select: { fileName: true, speaker: { select: { meetingId: true, userId: true } } },
    });
    // 讲者尚未认领邀约时没有绑定用户，无处可送
    if (!material?.speaker.userId) return;
    await notifyUserOfReview("MATERIAL_REVIEWED", {
      meetingId: material.speaker.meetingId,
      userId: material.speaker.userId,
      decision,
      subjectTitle: material.fileName,
      reviewNote,
    });
  } catch (error) {
    console.error("[notify hook] material reviewed", materialId, error);
  }
}
