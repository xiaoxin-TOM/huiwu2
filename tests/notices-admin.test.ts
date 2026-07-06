import { afterAll, beforeAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  listAllNotices,
  getNotice,
  createNotice,
  updateNotice,
  deleteNotice,
} from "@/lib/notices-admin";

const ids: string[] = [];
let meetingId: string;

beforeAll(async () => {
  const m = await prisma.meeting.create({ data: { title: "通知测试会议" } });
  meetingId = m.id;
});

afterAll(async () => {
  await prisma.notice.deleteMany({ where: { id: { in: ids } } });
  await prisma.meeting.delete({ where: { id: meetingId } }).catch(() => {});
  await prisma.$disconnect();
});

test("建→改→读(含未发布)→删 通知", async () => {
  const n = await createNotice(meetingId, { title: "草稿通知", contentHtml: "<p>x</p>", isPublished: false });
  ids.push(n.id);
  expect(n.isPublished).toBe(false);

  const all = await listAllNotices(meetingId);
  expect(all.some((x) => x.id === n.id)).toBe(true); // 未发布也在后台列表

  const up = await updateNotice(n.id, { title: "正式通知", contentHtml: "<p>y</p>", isPublished: true });
  expect(up.title).toBe("正式通知");
  expect(up.isPublished).toBe(true);

  expect((await getNotice(n.id, meetingId))?.title).toBe("正式通知");

  await deleteNotice(n.id);
  expect(await getNotice(n.id, meetingId)).toBeNull();
});
