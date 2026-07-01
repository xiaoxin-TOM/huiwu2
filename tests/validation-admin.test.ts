import { expect, test } from "vitest";
import { siteConfigSchema } from "@/lib/validation";

test("站点设置:必填会议名,选填默认空串", () => {
  expect(siteConfigSchema.safeParse({ confName: "" }).success).toBe(false);
  const r = siteConfigSchema.safeParse({
    confName: "示例年会", confDate: "2026-09", confLocation: "北京",
  });
  expect(r.success).toBe(true);
  if (r.success) expect(r.data.liveUrl).toBe("");
});
