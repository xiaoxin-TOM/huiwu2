import { afterAll, beforeAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import { getPublishedNotices, getNoticeById, getPage } from "@/lib/content";
import { upsertPage } from "@/lib/pages-admin";

const ids: string[] = [];
const pageSlugs: string[] = [];
let meetingId: string;

beforeAll(async () => {
  const m = await prisma.meeting.create({ data: { title: "内容测试会议" } });
  meetingId = m.id;
});

afterAll(async () => {
  await prisma.notice.deleteMany({ where: { id: { in: ids } } });
  await prisma.page.deleteMany({ where: { slug: { in: pageSlugs }, meetingId } });
  await prisma.meeting.delete({ where: { id: meetingId } }).catch(() => {});
  await prisma.$disconnect();
});

test("getPublishedNotices 只返回已发布并按时间降序", async () => {
  const older = await prisma.notice.create({
    data: { meetingId, title: "旧通知", isPublished: true, publishedAt: new Date("2026-01-01") },
  });
  const newer = await prisma.notice.create({
    data: { meetingId, title: "新通知", isPublished: true, publishedAt: new Date("2026-02-01") },
  });
  const hidden = await prisma.notice.create({
    data: { meetingId, title: "未发布", isPublished: false },
  });
  ids.push(older.id, newer.id, hidden.id);

  const list = await getPublishedNotices(meetingId);
  const titles = list.map((n) => n.title);
  expect(titles).not.toContain("未发布");
  expect(titles).toContain("新通知");
  expect(titles).toContain("旧通知");
  expect(titles.indexOf("新通知")).toBeLessThan(titles.indexOf("旧通知"));
});

test("getNoticeById 对未发布或不存在返回 null", async () => {
  const hidden = await prisma.notice.create({ data: { meetingId, title: "草稿", isPublished: false } });
  ids.push(hidden.id);
  expect(await getNoticeById(hidden.id, meetingId)).toBeNull();
  expect(await getNoticeById("不存在的id", meetingId)).toBeNull();
});

test("getPage 命中返回页,缺失返回 null", async () => {
  await prisma.page.create({
    data: { meetingId, slug: "venue-test", title: "交通测试", contentHtml: "<p>路线</p>" },
  });
  pageSlugs.push("venue-test");
  const page = await getPage("venue-test", meetingId);
  expect(page?.title).toBe("交通测试");
  expect(await getPage("不存在", meetingId)).toBeNull();
});

test("upsertPage 支持一图流模式(mode/imageUrl)并保留切换后的富文本内容", async () => {
  pageSlugs.push("image-flow-test");
  await upsertPage(meetingId, "image-flow-test", {
    title: "一图流测试",
    contentHtml: "<p>原始富文本</p>",
    mode: "TEXT",
    imageUrl: "",
  });
  await upsertPage(meetingId, "image-flow-test", {
    title: "一图流测试",
    contentHtml: "<p>原始富文本</p>",
    mode: "IMAGE",
    imageUrl: "https://example.com/a.png",
  });
  const page = await getPage("image-flow-test", meetingId);
  expect(page?.mode).toBe("IMAGE");
  expect(page?.imageUrl).toBe("https://example.com/a.png");
  // 切回富文本模式时原内容应仍然保留
  expect(page?.contentHtml).toBe("<p>原始富文本</p>");
});
