import { afterAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import { getPublishedNotices, getNoticeById } from "@/lib/content";

const ids: string[] = [];

afterAll(async () => {
  await prisma.notice.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

test("getPublishedNotices 只返回已发布并按时间降序", async () => {
  const older = await prisma.notice.create({
    data: { title: "旧通知", isPublished: true, publishedAt: new Date("2026-01-01") },
  });
  const newer = await prisma.notice.create({
    data: { title: "新通知", isPublished: true, publishedAt: new Date("2026-02-01") },
  });
  const hidden = await prisma.notice.create({
    data: { title: "未发布", isPublished: false },
  });
  ids.push(older.id, newer.id, hidden.id);

  const list = await getPublishedNotices();
  const titles = list.map((n) => n.title);
  expect(titles).not.toContain("未发布");
  expect(titles.indexOf("新通知")).toBeLessThan(titles.indexOf("旧通知"));
});

test("getNoticeById 对未发布或不存在返回 null", async () => {
  const hidden = await prisma.notice.create({ data: { title: "草稿", isPublished: false } });
  ids.push(hidden.id);
  expect(await getNoticeById(hidden.id)).toBeNull();
  expect(await getNoticeById("不存在的id")).toBeNull();
});
