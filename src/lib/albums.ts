import { prisma } from "@/lib/prisma";
import type { Album, Photo } from "@prisma/client";

export function listAlbums(meetingId: string): Promise<Album[]> {
  return prisma.album.findMany({ where: { meetingId }, orderBy: { date: "desc" } });
}

export function listAlbumsAdmin(meetingId: string): Promise<(Album & { photos: Photo[] })[]> {
  return prisma.album.findMany({
    where: { meetingId },
    orderBy: [{ startTime: "asc" }, { date: "desc" }],
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

export function createAlbum(
  meetingId: string,
  data: { title: string; date: string; note?: string; startTime?: string; endTime?: string }
) {
  return prisma.album.create({ data: { ...data, meetingId } });
}

export function addPhoto(albumId: string, url: string, caption: string) {
  return prisma.$transaction(async (tx) => {
    const photo = await tx.photo.create({ data: { albumId, url, caption } });
    const album = await tx.album.findUnique({ where: { id: albumId }, select: { coverUrl: true } });
    if (album && !album.coverUrl) {
      await tx.album.update({ where: { id: albumId }, data: { coverUrl: url } });
    }
    return photo;
  });
}

export async function addPhotos(albumId: string, photos: { url: string; caption: string }[]) {
  if (photos.length === 0) return;
  return prisma.$transaction(async (tx) => {
    await tx.photo.createMany({
      data: photos.map((p) => ({ albumId, url: p.url, caption: p.caption })),
    });
    const album = await tx.album.findUnique({ where: { id: albumId }, select: { coverUrl: true } });
    if (album && !album.coverUrl) {
      await tx.album.update({ where: { id: albumId }, data: { coverUrl: photos[0].url } });
    }
  });
}

export function deletePhoto(id: string) {
  return prisma.photo.delete({ where: { id } });
}

export function deleteAlbum(id: string) {
  return prisma.album.delete({ where: { id } });
}
