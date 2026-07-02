import { afterAll, beforeAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  updateSession,
  deleteSession,
  getSessionAdmin,
  addSessionSpeaker,
  removeSessionSpeaker,
} from "@/lib/schedule-admin";

let speakerId: string;
const sessionIds: string[] = [];

beforeAll(async () => {
  const s = await prisma.speaker.create({ data: { name: "日程测试讲者" } });
  speakerId = s.id;
});

afterAll(async () => {
  // Session/Speaker 删除时 SessionSpeaker 因 Cascade 自动清理
  await prisma.session.deleteMany({ where: { id: { in: sessionIds } } });
  await prisma.speaker.delete({ where: { id: speakerId } }).catch(() => {});
  await prisma.$disconnect();
});

test("建场次→改→指派讲者→读→撤销→删", async () => {
  const sess = await createSession({
    day: "2026-09-18", startTime: "09:00", endTime: "10:00",
    room: "主会场", title: "测试场次",
  });
  sessionIds.push(sess.id);
  expect(sess.title).toBe("测试场次");

  const up = await updateSession(sess.id, {
    day: "2026-09-18", startTime: "09:00", endTime: "10:30",
    room: "主会场", title: "测试场次改",
  });
  expect(up.endTime).toBe("10:30");

  await addSessionSpeaker(sess.id, speakerId, "SPEAKER");
  const full = await getSessionAdmin(sess.id);
  expect(full?.speakers).toHaveLength(1);
  expect(full?.speakers[0].speaker.name).toBe("日程测试讲者");
  expect(full?.speakers[0].role).toBe("SPEAKER");

  await expect(addSessionSpeaker(sess.id, speakerId, "SPEAKER")).rejects.toThrow("DUPLICATE_LINK");

  await removeSessionSpeaker(sess.id, speakerId, "SPEAKER");
  expect((await getSessionAdmin(sess.id))?.speakers).toHaveLength(0);

  await deleteSession(sess.id);
  expect(await getSessionAdmin(sess.id)).toBeNull();
});
