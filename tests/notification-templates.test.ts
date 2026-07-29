import { expect, test } from "vitest";
import {
  NOTIFICATION_TYPES,
  buildNotificationContent,
  nextAttemptDelayMs,
  shouldGiveUp,
  MAX_DELIVERY_ATTEMPTS,
} from "@/lib/notification-templates";

const meeting = { id: "m1", title: "第五届学术年会" };

test("每个事件类型都能生成文案，不留空标题", () => {
  for (const type of NOTIFICATION_TYPES) {
    const content = buildNotificationContent({
      type,
      meeting,
      actorName: "张三",
      subjectTitle: "深度学习进展",
      decision: "APPROVED",
      reviewNote: "",
    });
    expect(content.title.trim().length).toBeGreaterThan(0);
    expect(content.subject.trim().length).toBeGreaterThan(0);
    expect(content.emailText.trim().length).toBeGreaterThan(0);
  }
});

test("提交类通知指向管理员后台，审核类指向用户页面", () => {
  const submitted = buildNotificationContent({
    type: "SUBMISSION_SUBMITTED",
    meeting,
    actorName: "张三",
    subjectTitle: "深度学习进展",
  });
  expect(submitted.linkHref).toBe("/admin/submissions");

  const reviewed = buildNotificationContent({
    type: "SUBMISSION_REVIEWED",
    meeting,
    decision: "APPROVED",
    subjectTitle: "深度学习进展",
  });
  expect(reviewed.linkHref).toBe("/m/m1/submissions");
});

test("通过与驳回的文案不同，且都带上会议名", () => {
  const approved = buildNotificationContent({
    type: "REGISTRATION_REVIEWED",
    meeting,
    decision: "APPROVED",
  });
  const rejected = buildNotificationContent({
    type: "REGISTRATION_REVIEWED",
    meeting,
    decision: "REJECTED",
  });

  expect(approved.title).not.toBe(rejected.title);
  expect(approved.title).toContain("通过");
  expect(rejected.title).toContain("未通过");
  expect(approved.body).toContain("第五届学术年会");
  expect(rejected.body).toContain("第五届学术年会");
});

test("驳回带审核备注时正文包含原因", () => {
  const withNote = buildNotificationContent({
    type: "MATERIAL_REVIEWED",
    meeting,
    decision: "REJECTED",
    subjectTitle: "开幕报告.pptx",
    reviewNote: "版式有误，请重新导出",
  });
  expect(withNote.body).toContain("版式有误，请重新导出");

  const withoutNote = buildNotificationContent({
    type: "MATERIAL_REVIEWED",
    meeting,
    decision: "REJECTED",
    subjectTitle: "开幕报告.pptx",
    reviewNote: "",
  });
  expect(withoutNote.body).toContain("请登录查看详情");
});

test("提交类文案带上提交人和标题，便于管理员一眼判断", () => {
  const content = buildNotificationContent({
    type: "MATERIAL_SUBMITTED",
    meeting,
    actorName: "李四",
    subjectTitle: "专题报告.pdf",
  });
  expect(content.body).toContain("李四");
  expect(content.body).toContain("专题报告.pdf");
});

test("退避间隔逐次拉长", () => {
  const delays = [1, 2, 3, 4].map(nextAttemptDelayMs);
  expect(delays).toEqual([
    60 * 1000,
    5 * 60 * 1000,
    30 * 60 * 1000,
    2 * 60 * 60 * 1000,
  ]);
  for (let i = 1; i < delays.length; i += 1) {
    expect(delays[i]).toBeGreaterThan(delays[i - 1]);
  }
});

test("超过最大次数后放弃重试", () => {
  expect(shouldGiveUp(MAX_DELIVERY_ATTEMPTS - 1)).toBe(false);
  expect(shouldGiveUp(MAX_DELIVERY_ATTEMPTS)).toBe(true);
  expect(shouldGiveUp(MAX_DELIVERY_ATTEMPTS + 3)).toBe(true);
});

test("超出退避表的次数复用最后一档，不会返回 0 或 NaN", () => {
  const beyond = nextAttemptDelayMs(99);
  expect(Number.isFinite(beyond)).toBe(true);
  expect(beyond).toBeGreaterThan(0);
});
