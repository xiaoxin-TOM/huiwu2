import { prisma } from "@/lib/prisma";

export type SpeakerMaterialInput = {
  speakerId: string;
  sessionId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
};

export function createSpeakerMaterial(data: SpeakerMaterialInput) {
  return prisma.speakerMaterial.create({ data });
}

export function listSpeakerMaterials(speakerId: string) {
  return prisma.speakerMaterial.findMany({
    where: { speakerId },
    include: { session: true },
    orderBy: { uploadedAt: "desc" },
  });
}

export function getSpeakerMaterialById(id: string) {
  return prisma.speakerMaterial.findUnique({
    where: { id },
    include: { speaker: true, session: true },
  });
}
