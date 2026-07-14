import { afterAll, beforeAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createAlbum,
  getAlbum,
  addPhoto,
  deletePhoto,
} from "@/lib/albums";

const albumIds: string[] = [];
let meetingId: string;

beforeAll(async () => {
  const m = await prisma.meeting.create({ data: { title: "相册测试会议" } });
  meetingId = m.id;
});

afterAll(async () => {
  await prisma.album.deleteMany({ where: { id: { in: albumIds } } });
  await prisma.meeting.delete({ where: { id: meetingId } }).catch(() => {});
  await prisma.$disconnect();
});

test("建相册→加照片→读取→删照片", async () => {
  const album = await createAlbum(meetingId, { title: "开幕式相册", date: "2026-09-18" });
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
