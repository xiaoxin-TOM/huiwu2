import { afterAll, beforeAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createSubmission,
  listUserSubmissions,
  reviewSubmission,
} from "@/lib/submissions";

let userId: string;

beforeAll(async () => {
  const u = await prisma.user.create({
    data: { name: "投稿测试", email: "subtest@example.com", passwordHash: "x" },
  });
  userId = u.id;
});

afterAll(async () => {
  await prisma.submission.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await prisma.$disconnect();
});

test("创建投稿→列出用户投稿→审核回显", async () => {
  const sub = await createSubmission(userId, {
    title: "论文A", authors: "张三", abstract: "摘要", fileUrl: "/uploads/x.pdf",
  });
  expect(sub.status).toBe("PENDING");

  const list = await listUserSubmissions(userId);
  expect(list).toHaveLength(1);
  expect(list[0].title).toBe("论文A");

  const reviewed = await reviewSubmission(sub.id, "REJECTED");
  expect(reviewed.status).toBe("REJECTED");
});
