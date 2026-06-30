import { afterAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createAlbum,
  getAlbum,
  addPhoto,
  deletePhoto,
} from "@/lib/albums";

const albumIds: string[] = [];

afterAll(async () => {
  // Photo 对 Album 为 Cascade,删 Album 即连带删照片
  await prisma.album.deleteMany({ where: { id: { in: albumIds } } });
  await prisma.$disconnect();
});

test("建相册→加照片→读取→删照片", async () => {
  const album = await createAlbum({ title: "开幕式相册", date: "2026-09-18" });
  albumIds.push(album.id);

  const p1 = await addPhoto(album.id, "/uploads/images/a.jpg", "合影");
  await addPhoto(album.id, "/uploads/images/b.jpg", "");

  const full = await getAlbum(album.id);
  expect(full?.photos).toHaveLength(2);
  expect(full?.photos[0].caption).toBe("合影");

  await deletePhoto(p1.id);
  const after = await getAlbum(album.id);
  expect(after?.photos).toHaveLength(1);
});
