import { expect, test } from "vitest";
import { validateImage, validateImageContent } from "@/lib/upload";

test("接受 jpeg/png/webp", () => {
  expect(validateImage({ type: "image/jpeg", size: 1000 })).toBeNull();
  expect(validateImage({ type: "image/png", size: 1000 })).toBeNull();
  expect(validateImage({ type: "image/webp", size: 1000 })).toBeNull();
});

test("拒绝非图片类型", () => {
  expect(validateImage({ type: "application/pdf", size: 1000 })).toBe("仅支持 JPG/PNG/WebP 图片");
});

test("拒绝超过 10MB", () => {
  expect(validateImage({ type: "image/jpeg", size: 11 * 1024 * 1024 })).toBe("图片不能超过 10MB");
});

test("正好 10MB 通过", () => {
  expect(validateImage({ type: "image/jpeg", size: 10 * 1024 * 1024 })).toBeNull();
});

test("校验图片真实文件头", () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const webp = Buffer.from("RIFF0000WEBP", "ascii");
  expect(validateImageContent(jpeg, "image/jpeg")).toBeNull();
  expect(validateImageContent(png, "image/png")).toBeNull();
  expect(validateImageContent(webp, "image/webp")).toBeNull();
  expect(validateImageContent(Buffer.from("not an image"), "image/png")).toBe("图片内容与文件类型不匹配");
});
