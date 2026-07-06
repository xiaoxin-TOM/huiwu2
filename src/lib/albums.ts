import { prisma } from "@/lib/prisma";
import type { Album, Photo } from "@prisma/client";

export function listAlbums(meetingId: string): Promise<Album[]> {
  return prisma.album.findMany({ where: { meetingId }, orderBy: { date: "desc" } });
}

export function listAlbumsAdmin(meetingId: string): Promise<(Album & { photos: Photo[] })[]> {
  return prisma.album.findMany({
    where: { meetingId },
    orderBy: { date: "desc" },
    include: { photos: { orderBy: { createdAt: "asc" } } },
  });
}

export function getAlbum(id: string, meetingId?: string): Promise<(Album & { photos: Photo[] }) | null> {
  const where: { id: string; meetingId?: string } = { id };
  if (meetingId) where.meetingId = meetingId;
  return prisma.album.findFirst({
    where,
    include: { photos: { orderBy: { createdAt: "asc" } } },
  });
}

export function createAlbum(meetingId: string, data: { title: string; date: string }) {
  return prisma.album.create({ data: { ...data, meetingId } });
}

export function addPhoto(albumId: string, url: string, caption: string) {
  return prisma.photo.create({ data: { albumId, url, caption } });
}

export function deletePhoto(id: string) {
  return prisma.photo.delete({ where: { id } });
}

export function deleteAlbum(id: string) {
  return prisma.album.delete({ where: { id } });
}
