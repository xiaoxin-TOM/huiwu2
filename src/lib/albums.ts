import { prisma } from "@/lib/prisma";

export function listAlbums() {
  return prisma.album.findMany({ orderBy: { date: "desc" } });
}

export function listAlbumsAdmin() {
  return prisma.album.findMany({
    orderBy: { date: "desc" },
    include: { photos: { orderBy: { createdAt: "asc" } } },
  });
}

export function getAlbum(id: string) {
  return prisma.album.findUnique({
    where: { id },
    include: { photos: { orderBy: { createdAt: "asc" } } },
  });
}

export function createAlbum(data: { title: string; date: string }) {
  return prisma.album.create({ data });
}

export function addPhoto(albumId: string, url: string, caption: string) {
  return prisma.photo.create({ data: { albumId, url, caption } });
}

export function deletePhoto(id: string) {
  return prisma.photo.delete({ where: { id } });
}
