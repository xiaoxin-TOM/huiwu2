import { expect, test } from "vitest";
import { validatePdf } from "@/lib/upload";

test("接受 PDF", () => {
  expect(validatePdf({ type: "application/pdf", size: 1000 })).toBeNull();
});

test("拒绝非 PDF 类型", () => {
  expect(validatePdf({ type: "image/png", size: 1000 })).toBe("仅支持 PDF 文件");
});

test("拒绝超过 10MB 的文件", () => {
  expect(validatePdf({ type: "application/pdf", size: 11 * 1024 * 1024 })).toBe("文件不能超过 10MB");
});
