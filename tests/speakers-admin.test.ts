import { afterAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import { getSpeakerById } from "@/lib/speakers";
import { createSpeaker, updateSpeaker, deleteSpeaker } from "@/lib/speakers-admin";

const ids: string[] = [];

afterAll(async () => {
  await prisma.speaker.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

test("建→改→删 讲者", async () => {
  const s = await createSpeaker({
    name: "测试讲者", title: "教授", organization: "测试大学", bio: "<p>简介</p>",
    photoUrl: "", isModerator: false,
  });
  ids.push(s.id);
  expect(s.name).toBe("测试讲者");
  expect(s.isModerator).toBe(false);

  const up = await updateSpeaker(s.id, {
    name: "测试讲者", title: "主任", organization: "测试大学", bio: "<p>新简介</p>",
    photoUrl: "", isModerator: true,
  });
  expect(up.title).toBe("主任");
  expect(up.isModerator).toBe(true);

  await deleteSpeaker(s.id);
  expect(await getSpeakerById(s.id)).toBeNull();
});
