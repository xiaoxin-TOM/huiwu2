import { describe, expect, test } from "vitest";
import { liveStreamSchema, liveStreamsSchema } from "@/lib/validation";

const baseItem = { name: "主会场", url: "https://live.example.com", coverImage: "", introImage: "", description: "", time: "", isVisible: true };

describe("直播会场", () => {
  test("会场名称与外部链接必填", () => {
    expect(liveStreamSchema.safeParse(baseItem).success).toBe(true);
    expect(liveStreamSchema.safeParse({ ...baseItem, name: "" }).success).toBe(false);
    expect(liveStreamSchema.safeParse({ ...baseItem, url: "" }).success).toBe(false);
  });

  test("直播地址只接受 http(s) 外部链接", () => {
    expect(liveStreamSchema.safeParse({ ...baseItem, url: "https://live.example.com" }).success).toBe(true);
    expect(liveStreamSchema.safeParse({ ...baseItem, url: "http://live.example.com" }).success).toBe(true);
    expect(liveStreamSchema.safeParse({ ...baseItem, url: "/internal" }).success).toBe(false);
    expect(liveStreamSchema.safeParse({ ...baseItem, url: "javascript:alert(1)" }).success).toBe(false);
  });

  test("封面图允许为空或有效图片地址", () => {
    expect(liveStreamSchema.safeParse({ ...baseItem, coverImage: "" }).success).toBe(true);
    expect(liveStreamSchema.safeParse({ ...baseItem, coverImage: "https://cdn.example.com/cover.jpg" }).success).toBe(true);
    expect(liveStreamSchema.safeParse({ ...baseItem, coverImage: "//invalid" }).success).toBe(false);
  });

  test("直播介绍图片允许为空或有效图片地址", () => {
    expect(liveStreamSchema.safeParse({ ...baseItem, introImage: "" }).success).toBe(true);
    expect(liveStreamSchema.safeParse({ ...baseItem, introImage: "https://cdn.example.com/intro.jpg" }).success).toBe(true);
    expect(liveStreamSchema.safeParse({ ...baseItem, introImage: "//invalid" }).success).toBe(false);
  });

  test("会场描述不超过 200 字", () => {
    expect(liveStreamSchema.safeParse({ ...baseItem, description: "开幕式" }).success).toBe(true);
    expect(liveStreamSchema.safeParse({ ...baseItem, description: "a".repeat(201) }).success).toBe(false);
  });

  test("观看时间不超过 100 字", () => {
    expect(liveStreamSchema.safeParse({ ...baseItem, time: "2026-09-18 09:00-12:00" }).success).toBe(true);
    expect(liveStreamSchema.safeParse({ ...baseItem, time: "a".repeat(101) }).success).toBe(false);
  });

  test("直播会场数量限制", () => {
    expect(liveStreamsSchema.safeParse({ items: Array.from({ length: 20 }, () => baseItem) }).success).toBe(true);
    expect(liveStreamsSchema.safeParse({ items: Array.from({ length: 21 }, () => baseItem) }).success).toBe(false);
  });
});
