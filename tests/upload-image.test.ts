import { expect, test } from "vitest";
import { validateImage } from "@/lib/upload";

test("接受 jpeg/png/webp", () => {
  expect(validateImage({ type: "image/jpeg", size: 1000 })).toBeNull();
  expect(validateImage({ type: "image/png", size: 1000 })).toBeNull();
  expect(validateImage({ type: "image/webp", size: 1000 })).toBeNull();
});

test("拒绝非图片类型", () => {
  expect(validateImage({ type: "application/pdf", size: 1000 })).toBe("仅支持 JPG/PNG/WebP 图片");
});

test("拒绝超过 5MB", () => {
  expect(validateImage({ type: "image/jpeg", size: 6 * 1024 * 1024 })).toBe("图片不能超过 5MB");
});

test("正好 5MB 通过", () => {
  expect(validateImage({ type: "image/jpeg", size: 5 * 1024 * 1024 })).toBeNull();
});
