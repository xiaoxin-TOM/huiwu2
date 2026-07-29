import { expect, test } from "vitest";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_LABEL,
  feedbackSchema,
  feedbackReplySchema,
  meetingContactSchema,
} from "@/lib/validation";
import { hasAnyContactInfo, contactQrCards } from "@/lib/meeting-contact";
import { buildNotificationContent, NOTIFICATION_TYPES } from "@/lib/notification-templates";

test("每个反馈分类都有中文标签", () => {
  for (const c of FEEDBACK_CATEGORIES) {
    expect(FEEDBACK_CATEGORY_LABEL[c]?.length).toBeGreaterThan(0);
  }
});

test("反馈内容不能为空且有长度上限", () => {
  expect(feedbackSchema.safeParse({ category: "BUG", content: "" }).success).toBe(false);
  expect(feedbackSchema.safeParse({ category: "BUG", content: "  " }).success).toBe(false);
  expect(feedbackSchema.safeParse({ category: "BUG", content: "打不开日程页" }).success).toBe(true);
  expect(feedbackSchema.safeParse({ category: "BUG", content: "x".repeat(2001) }).success).toBe(false);
});

test("非法反馈分类被拒绝，缺省归为其他", () => {
  expect(feedbackSchema.safeParse({ category: "HACK", content: "内容" }).success).toBe(false);
  const parsed = feedbackSchema.safeParse({ content: "内容" });
  expect(parsed.success).toBe(true);
  if (parsed.success) expect(parsed.data.category).toBe("OTHER");
});

test("回复内容不能为空", () => {
  expect(feedbackReplySchema.safeParse({ reply: "" }).success).toBe(false);
  expect(feedbackReplySchema.safeParse({ reply: "已修复，请刷新重试" }).success).toBe(true);
});

test("二维码只接受站内路径或 http(s) 链接，挡掉 javascript: 与协议相对地址", () => {
  const base = { orgName: "主办方" };
  for (const bad of ["javascript:alert(1)", "//evil.com/qr.png", "data:image/png;base64,AAA"]) {
    expect(meetingContactSchema.safeParse({ ...base, wecomQrUrl: bad }).success).toBe(false);
  }
  for (const good of ["", "/imgs/qr.png", "https://oss.example.com/qr.png"]) {
    expect(meetingContactSchema.safeParse({ ...base, wecomQrUrl: good }).success).toBe(true);
  }
});

test("联系电话留空可通过——管理员可以只放二维码", () => {
  expect(meetingContactSchema.safeParse({}).success).toBe(true);
});

test("hasAnyContactInfo 判断是否有可展示内容", () => {
  expect(hasAnyContactInfo(null)).toBe(false);
  expect(hasAnyContactInfo({ orgName: "", phone: "", phone2: "", email: "", wechatId: "", address: "", wecomQrUrl: null, groupQrUrl: null, mpQrUrl: null })).toBe(false);
  expect(hasAnyContactInfo({ orgName: "", phone: "010-12345678", phone2: "", email: "", wechatId: "", address: "", wecomQrUrl: null, groupQrUrl: null, mpQrUrl: null })).toBe(true);
  expect(hasAnyContactInfo({ orgName: "", phone: "", phone2: "", email: "", wechatId: "", address: "", wecomQrUrl: "/q.png", groupQrUrl: null, mpQrUrl: null })).toBe(true);
});

test("contactQrCards 只返回已上传的二维码，且带正确标题", () => {
  const cards = contactQrCards({
    wecomQrUrl: "/wecom.png",
    groupQrUrl: null,
    mpQrUrl: "/mp.png",
    wecomNote: "工作日 9:00-18:00",
    groupNote: "",
    mpNote: "",
  });
  expect(cards).toHaveLength(2);
  expect(cards[0].title).toContain("客服");
  expect(cards[0].note).toBe("工作日 9:00-18:00");
  expect(cards[1].url).toBe("/mp.png");
  expect(cards.every((c) => c.url)).toBe(true);
});

test("没有任何二维码时返回空数组", () => {
  expect(
    contactQrCards({ wecomQrUrl: null, groupQrUrl: null, mpQrUrl: null, wecomNote: "", groupNote: "", mpNote: "" }),
  ).toHaveLength(0);
});

test("反馈的两个通知事件已纳入通知中心", () => {
  expect(NOTIFICATION_TYPES).toContain("FEEDBACK_SUBMITTED");
  expect(NOTIFICATION_TYPES).toContain("FEEDBACK_REPLIED");

  const submitted = buildNotificationContent({
    type: "FEEDBACK_SUBMITTED",
    meeting: { id: "m1", title: "年会" },
    actorName: "张三",
    subjectTitle: "问题反馈",
  });
  expect(submitted.linkHref).toBe("/admin/feedback");

  const replied = buildNotificationContent({
    type: "FEEDBACK_REPLIED",
    meeting: { id: "m1", title: "年会" },
  });
  expect(replied.linkHref).toBe("/m/m1/feedback");
  expect(replied.title.length).toBeGreaterThan(0);
});
