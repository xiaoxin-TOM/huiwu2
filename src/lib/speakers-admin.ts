import { prisma } from "@/lib/prisma";

type SpeakerData = {
  name: string;
  title: string;
  organization: string;
  bio: string;
  photoUrl: string;
  isModerator: boolean;
};

export function createSpeaker(meetingId: string, data: SpeakerData) {
  return prisma.speaker.create({ data: { ...data, meetingId } });
}

export function updateSpeaker(id: string, data: SpeakerData) {
  return prisma.speaker.update({ where: { id }, data });
}

export function deleteSpeaker(id: string) {
  return prisma.speaker.delete({ where: { id } });
}
